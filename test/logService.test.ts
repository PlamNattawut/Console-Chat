import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { FileLogService } from "../src/log/LogService";
import { Message } from "../src/contracts/message";
import fs from "fs";
import path from "path";

const TEST_LOG_FILE = path.join(__dirname, "test-chat.log");

const mockMessage = (overrides?: Partial<Message>): Message => ({
    id: "test-id-001",
    username: "Thanathon",
    content: "Hello everyone!",
    timestamp: new Date("2026-08-30T12:30:00").getTime(),
    ...overrides
});

describe("การทดสอบระบบเก็บบันทึกแชท (LogService)", () => {
    let service: FileLogService;

    beforeEach(() => {
        service = new FileLogService(TEST_LOG_FILE);
    });

    afterEach(() => {
        if (fs.existsSync(TEST_LOG_FILE)) {
            fs.unlinkSync(TEST_LOG_FILE);
        }
    });

    describe("การทำงานปกติ", () => {
        describe("1.1 การบันทึกข้อความลงหน่วยความจำ (In-Memory History)", () => {
            it("เก็บข้อความลง history ได้สำเร็จเมื่อเรียก save", () => {
                const msg = mockMessage();
                service.save(msg);

                const history = service.getHistory();
                expect(history).toHaveLength(1);
                expect(history[0].id).toBe(msg.id);
            });

            it("เก็บข้อความหลายรายการเรียงตามลำดับถูกต้อง", () => {
                const msg1 = mockMessage({ id: "1", content: "First" });
                const msg2 = mockMessage({ id: "2", content: "Second" });

                service.save(msg1);
                service.save(msg2);

                const history = service.getHistory();
                expect(history).toHaveLength(2);
                expect(history[0].id).toBe("1");
                expect(history[1].id).toBe("2");
            });
        });

        describe("1.2 การบันทึกข้อความลงไฟล์ (File System)", () => {
            it("เขียนข้อความที่จัดรูปแบบแล้วลงไฟล์เป้าหมายได้สำเร็จ", () => {
                const msg = mockMessage();
                service.save(msg);

                expect(fs.existsSync(TEST_LOG_FILE)).toBe(true);
                const fileContent = fs.readFileSync(TEST_LOG_FILE, "utf-8");
                expect(fileContent).toContain("Thanathon:");
                expect(fileContent).toContain("Hello everyone!");
            });

            it("ต่อท้ายข้อความในไฟล์เมื่อมีการบันทึกหลายครั้ง (Append Mode)", () => {
                const msg1 = mockMessage({ content: "First" });
                const msg2 = mockMessage({ content: "Second" });

                service.save(msg1);
                service.save(msg2);

                const fileContent = fs.readFileSync(TEST_LOG_FILE, "utf-8");
                expect(fileContent).toContain("First");
                expect(fileContent).toContain("Second");
            });
        });

        describe("1.3 การดึงประวัติแชท (getHistory)", () => {
            it("ส่งคืนอาร์เรย์ว่างเมื่อยังไม่มีประวัติแชท", () => {
                expect(service.getHistory()).toEqual([]);
            });

            it("คืนค่าแบบสร้าง Array ใหม่เพื่อป้องกันการเพิ่ม/ลบ ข้อมูลตรงๆ (Immutability)", () => {
                service.save(mockMessage());

                const history = service.getHistory();
                history.push(mockMessage({ id: "fake-id" }));

                expect(service.getHistory()).toHaveLength(1);
            });
        });
    });

    describe("การจัดการข้อผิดพลาดและขอบเขตข้อมูล", () => {
        describe("2.1 การป้องกันข้อความถูกแก้ไขจากภายนอก (Reference Mutation)", () => {
            it("ข้อความที่บันทึกแล้ว ต้องไม่ถูกแก้ไขเมื่อต้นทางถูกเปลี่ยนค่า (ต้อง Deep Copy)", () => {
                const msg = mockMessage({ username: "Thanathon" });
                service.save(msg);

                msg.username = "Hacker";

                const history = service.getHistory();
                expect(history[0].username).toBe("Thanathon");
            });

            it("ข้อความที่ดึงมาจาก getHistory() ต้องไม่กระทบข้อมูลหลักเมื่อถูกแก้ไข", () => {
                service.save(mockMessage({ username: "Thanathon" }));

                const history = service.getHistory();
                history[0].username = "Hacker";

                const freshHistory = service.getHistory();
                expect(freshHistory[0].username).toBe("Thanathon");
            });
        });

        describe("2.2 ความเสถียรเมื่อข้อมูล Message ผิดปกติ", () => {
            it("ต้องไม่พังเมื่อ Message เป็น null หรือ undefined", () => {
                expect(() => service.save(null as unknown as Message)).not.toThrow();
                expect(() => service.save(undefined as unknown as Message)).not.toThrow();
            });

            it("ไม่ควรบันทึก Message ที่ผิดปกติลงใน In-Memory History (เพื่อป้องกัน History สกปรก)", () => {
                service.save(null as unknown as Message);

                expect(service.getHistory()).toHaveLength(0);
            });
        });

        describe("2.3 ความเสถียรเมื่อการบันทึกไฟล์มีปัญหา", () => {
            it("ต้องไม่แครชแอปพลิเคชัน แม้ไฟล์เป้าหมายจะไม่สามารถเขียนได้ (เช่น Directory ไม่มีอยู่จริง)", () => {
                const badService = new FileLogService("/invalid/dir/that/does/not/exist/chat.log");

                expect(() => badService.save(mockMessage())).not.toThrow();
            });

            it("ถึงแม้บันทึกไฟล์ไม่สำเร็จ แต่ In-Memory History ก็ควรมีข้อมูล (หรือควรจะ roll back ถ้าพัง?)", () => {
                const badService = new FileLogService("/invalid/dir/that/does/not/exist/chat.log");
                badService.save(mockMessage());

                expect(badService.getHistory()).toHaveLength(1);
            });
        });

        describe("2.4 การจำกัดขนาดประวัติแชท", () => {
            it("จำกัดจำนวนข้อความในประวัติแชทสูงสุดที่ 100 ข้อความเพื่อป้องกันหน่วยความจำเต็ม", () => {
                for (let i = 0; i < 150; i++) {
                    service.save(mockMessage({ id: `msg-${i}`, content: `Test ${i}` }));
                }

                const history = service.getHistory();

                expect(history.length).toBeLessThanOrEqual(100);
                expect(history[0].id).not.toBe("msg-0");
                expect(history[history.length - 1].id).toBe("msg-149");
            });
        });
    });
});
