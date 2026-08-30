import { describe, it, expect } from "bun:test";
import {
    createMessage,
    formatMessage,
    formatMessages,
    filterMessages
} from "../src/message/message";
import { Message } from "../src/contracts/message";

const mockMessage = (overrides?: Partial<Message>): Message => ({
    id: "test-id-001",
    username: "Thanathon",
    content: "Hello everyone!",
    timestamp: new Date("2026-08-30T12:30:00").getTime(),
    ...overrides
});

describe("การทดสอบระบบจัดการข้อความ (Message Module)", () => {
    describe("การทำงานปกติ", () => {
        describe("1.1 การสร้างข้อความ (createMessage)", () => {
            it("สร้างข้อความที่มี id, username, content และ timestamp ครบถ้วน", () => {
                const msg = createMessage("Thanathon", "Hello!");

                expect(msg.id).toBeDefined();
                expect(msg.id.length).toBeGreaterThan(0);
                expect(msg.username).toBe("Thanathon");
                expect(msg.content).toBe("Hello!");
                expect(msg.timestamp).toBeGreaterThan(0);
            });

            it("สร้างข้อความแต่ละครั้งจะได้ id ไม่ซ้ำกัน (UUID)", () => {
                const msg1 = createMessage("Thanathon", "First");
                const msg2 = createMessage("Thanathon", "Second");

                expect(msg1.id).not.toBe(msg2.id);
            });

            it("timestamp ต้องเป็นค่าปัจจุบัน (ไม่ใช่ค่าในอนาคตหรืออดีตไกล)", () => {
                const before = Date.now();
                const msg = createMessage("Thanathon", "Test");
                const after = Date.now();

                expect(msg.timestamp).toBeGreaterThanOrEqual(before);
                expect(msg.timestamp).toBeLessThanOrEqual(after);
            });

            it("เก็บ username และ content ตรงตามที่ส่งเข้ามา", () => {
                const msg = createMessage("Alice_99", "สวัสดีครับ Thanathon!");

                expect(msg.username).toBe("Alice_99");
                expect(msg.content).toBe("สวัสดีครับ Thanathon!");
            });
        });

        describe("1.2 การจัดรูปแบบข้อความ (formatMessage)", () => {
            it("จัดรูปแบบเป็น [เวลา] ชื่อผู้ใช้: เนื้อหา", () => {
                const msg = mockMessage();
                const result = formatMessage(msg);

                expect(result).toContain("[");
                expect(result).toContain("]");
                expect(result).toContain("Thanathon:");
                expect(result).toContain("Hello everyone!");
            });

            it("แสดง timestamp ในรูปแบบเวลาที่อ่านได้", () => {
                const msg = mockMessage();
                const result = formatMessage(msg);
                const timePattern = /\[\d{1,2}:\d{2}:\d{2}/;

                expect(timePattern.test(result)).toBe(true);
            });
        });

        describe("1.3 การจัดรูปแบบข้อความหลายรายการ (formatMessages)", () => {
            it("จัดรูปแบบข้อความทุกรายการในอาร์เรย์", () => {
                const messages = [
                    mockMessage({ username: "Thanathon", content: "Hi!" }),
                    mockMessage({ username: "Alice", content: "Hello!" }),
                    mockMessage({ username: "Bob", content: "Hey!" })
                ];

                const result = formatMessages(messages);

                expect(result).toHaveLength(3);
                expect(result[0]).toContain("Thanathon:");
                expect(result[0]).toContain("Hi!");
                expect(result[1]).toContain("Alice:");
                expect(result[2]).toContain("Bob:");
            });

            it("ส่งคืนอาร์เรย์ว่างเมื่อไม่มีข้อความ", () => {
                const result = formatMessages([]);

                expect(result).toEqual([]);
            });
        });

        describe("1.4 การกรองข้อความด้วยคำค้นหา (filterMessages)", () => {
            const messages = [
                mockMessage({ content: "Hello Thanathon!" }),
                mockMessage({ content: "Good morning everyone" }),
                mockMessage({ content: "Thanathon is here" }),
                mockMessage({ content: "Goodbye" })
            ];

            it("กรองข้อความที่ตรงกับคำค้นหาได้ถูกต้อง", () => {
                const result = filterMessages(messages, "Thanathon");

                expect(result).toHaveLength(2);
                expect(result[0].content).toBe("Hello Thanathon!");
                expect(result[1].content).toBe("Thanathon is here");
            });

            it("กรองแบบ case-insensitive ได้ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)", () => {
                const result = filterMessages(messages, "thanathon");

                expect(result).toHaveLength(2);
            });

            it("ส่งคืนอาร์เรย์ว่างเมื่อไม่มีข้อความที่ตรงกับคำค้นหา", () => {
                const result = filterMessages(messages, "ไม่มีคำนี้");

                expect(result).toHaveLength(0);
            });

            it("กรองข้อความภาษาไทยได้ถูกต้อง", () => {
                const thaiMessages = [
                    mockMessage({ content: "สวัสดีครับ" }),
                    mockMessage({ content: "ยินดีต้อนรับ Thanathon" }),
                    mockMessage({ content: "Hello World" })
                ];

                const result = filterMessages(thaiMessages, "สวัสดี");

                expect(result).toHaveLength(1);
                expect(result[0].content).toBe("สวัสดีครับ");
            });
        });
    });

    describe("การจัดการข้อผิดพลาดและขอบเขตข้อมูล", () => {
        describe("2.1 createMessage ต้องไม่เก็บข้อมูลสกปรก", () => {
            it("ต้อง trim ช่องว่างหน้า-หลังของ username และ content ก่อนเก็บ", () => {
                const msg = createMessage("  Thanathon  ", "  Hello!  ");

                expect(msg.username).toBe("Thanathon");
                expect(msg.content).toBe("Hello!");
            });
        });

        describe("2.2 การป้องกัน Log Injection", () => {
            it("ระบบจัดรูปแบบข้อความต้องกรองอักขระขึ้นบรรทัดใหม่เพื่อป้องกันโครงสร้างไฟล์ Log เสียหาย", () => {
                const maliciousMsg = createMessage("GodJa_Hacker", "Hello\n[12:00:00] Admin_Thanathon: You are banned");
                const formatted = formatMessage(maliciousMsg);

                expect(formatted.includes("\n")).toBe(false);
            });
        });

        describe("2.3 formatMessage ต้องรองรับข้อมูลที่ผิดปกติ", () => {
            it("ต้องไม่พังเมื่อ timestamp เป็นค่าที่ไม่ถูกต้อง เช่น NaN", () => {
                const msg = mockMessage({ timestamp: NaN });

                expect(() => formatMessage(msg)).not.toThrow();

                const result = formatMessage(msg);
                expect(result).not.toContain("undefined");
                expect(result).not.toContain("NaN");
            });

            it("ต้องไม่พังเมื่อ timestamp เป็นค่าลบ", () => {
                const msg = mockMessage({ timestamp: -1 });

                expect(() => formatMessage(msg)).not.toThrow();
            });

            it("ต้องไม่พังเมื่อ username หรือ content เป็นค่าว่าง", () => {
                const msg = mockMessage({ username: "", content: "" });

                expect(() => formatMessage(msg)).not.toThrow();
            });
        });

        describe("2.3 filterMessages ต้องจัดการกรณีขอบ (Edge Cases)", () => {
            it("ค้นหาด้วยคำค้นว่าง ('') ต้องไม่คืนทุกข้อความ (ควรกรองออก)", () => {
                const messages = [
                    mockMessage({ content: "Hello" }),
                    mockMessage({ content: "World" })
                ];

                const result = filterMessages(messages, "");

                expect(result).toHaveLength(0);
            });

            it("ต้องไม่พังเมื่อ message.content เป็น null หรือ undefined", () => {
                const messages = [
                    mockMessage({ content: null as unknown as string }),
                    mockMessage({ content: undefined as unknown as string })
                ];

                expect(() => filterMessages(messages, "test")).not.toThrow();
            });
        });

        describe("2.4 formatMessages ต้องรองรับข้อมูลที่ผิดปกติ", () => {
            it("ต้องไม่พังเมื่อบางรายการในอาร์เรย์มีข้อมูลไม่สมบูรณ์", () => {
                const messages = [
                    mockMessage({ username: "Thanathon", content: "OK" }),
                    mockMessage({ username: "", content: "" })
                ];

                expect(() => formatMessages(messages)).not.toThrow();
                expect(formatMessages(messages)).toHaveLength(2);
            });
        });
    });
});
