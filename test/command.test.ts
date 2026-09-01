import { describe, it, expect } from "bun:test";
import { parseCommand } from "../src/command/command";

describe("การทดสอบระบบตีความคำสั่ง (Command Parser)", () => {
    describe("การทำงานปกติ", () => {
        describe("1.1 คำสั่งระบบพื้นฐาน", () => {
            it("ตีความคำสั่ง /help ได้ถูกต้อง", () => {
                const result = parseCommand("/help");
                expect(result.type).toBe("HELP");
            });

            it("ตีความคำสั่ง /users ได้ถูกต้อง", () => {
                const result = parseCommand("/users");
                expect(result.type).toBe("USERS");
            });

            it("ตีความคำสั่ง /clear ได้ถูกต้อง", () => {
                const result = parseCommand("/clear");
                expect(result.type).toBe("CLEAR");
            });

            it("ตีความคำสั่ง /quit ได้ถูกต้อง", () => {
                const result = parseCommand("/quit");
                expect(result.type).toBe("QUIT");
            });
        });

        describe("1.2 การจัดการตัวพิมพ์ใหญ่-เล็ก (Case Insensitive)", () => {
            it("รองรับคำสั่งที่เป็นตัวพิมพ์ใหญ่ทั้งหมด", () => {
                expect(parseCommand("/HELP").type).toBe("HELP");
                expect(parseCommand("/USERS").type).toBe("USERS");
                expect(parseCommand("/CLEAR").type).toBe("CLEAR");
                expect(parseCommand("/QUIT").type).toBe("QUIT");
            });

            it("รองรับคำสั่งที่เป็นตัวพิมพ์ผสม (CamelCase/Mixed)", () => {
                expect(parseCommand("/Help").type).toBe("HELP");
                expect(parseCommand("/uSeRs").type).toBe("USERS");
                expect(parseCommand("/cLeAr").type).toBe("CLEAR");
                expect(parseCommand("/QuIt").type).toBe("QUIT");
            });
        });

        describe("1.3 การตัดช่องว่างหน้า-หลัง (Whitespace Trimming)", () => {
            it("ตีความคำสั่งได้แม้มีช่องว่างด้านหน้าหรือด้านหลัง", () => {
                expect(parseCommand("  /help  ").type).toBe("HELP");
                expect(parseCommand("\t/users\n").type).toBe("USERS");
            });
        });

        describe("1.4 การตีความข้อความแชทปกติ (MESSAGE)", () => {
            it("ตีความข้อความที่ไม่ได้ขึ้นต้นด้วย / เป็น MESSAGE", () => {
                const result = parseCommand("สวัสดีครับ");
                expect(result.type).toBe("MESSAGE");
                
                if (result.type === "MESSAGE") {
                    expect(result.content).toBe("สวัสดีครับ");
                }
            });

            it("ตีความข้อความที่มี / แต่ไม่ใช่คำสั่งระบบเป็น MESSAGE", () => {
                const result = parseCommand("I use /linux everyday");
                expect(result.type).toBe("MESSAGE");
                
                if (result.type === "MESSAGE") {
                    expect(result.content).toBe("I use /linux everyday");
                }
            });
        });
    });

    describe("การจัดการข้อผิดพลาดและขอบเขตข้อมูล", () => {
        describe("2.1 การจัดการข้อมูลที่ไม่ใช่ String", () => {
            it("ไม่แครชและคืนค่าเป็น MESSAGE หรือจัดการข้อผิดพลาดได้ดี เมื่อ input ไม่ใช่ string", () => {
                expect(() => parseCommand(null as unknown as string)).not.toThrow();
                expect(() => parseCommand(undefined as unknown as string)).not.toThrow();
                expect(() => parseCommand({} as unknown as string)).not.toThrow();
            });
        });

        describe("2.2 การจัดการคำสั่งที่มี Parameter ต่อท้าย", () => {
            it("ถ้าพิมพ์ /help ตามด้วยข้อความอื่น ควรจะยังคงเป็น HELP หรือแจ้งเตือน (ไม่ใช่กลายเป็น MESSAGE ส่งลงแชท)", () => {
                const result = parseCommand("/help me");
                
                expect(result.type as string).not.toBe("MESSAGE");
            });

            it("คำสั่งระบบที่ขึ้นต้นด้วย / ตัวอื่นๆ ก็ไม่ควรหลุดไปเป็น MESSAGE", () => {
                expect(parseCommand("/users all").type as string).not.toBe("MESSAGE");
                expect(parseCommand("/quit now").type as string).not.toBe("MESSAGE");
            });
        });

        describe("2.3 การจัดการข้อความแชทที่เป็นคำสั่งปลอมหรือคำสั่งที่ไม่รู้จัก", () => {
            it("คำสั่งที่ไม่รู้จัก (ขึ้นต้นด้วย /) ไม่ควรส่งเป็น MESSAGE ลงแชท (เพื่อป้องกันข้อมูลรั่วไหลหรือกดผิด)", () => {
                const result = parseCommand("/unknowncommand");
                
                expect(result.type as string).not.toBe("MESSAGE");
            });
        });

        describe("2.4 การจัดการข้อความที่มาพร้อมกับ Case ผิดปกติและการเก็บเนื้อหา", () => {
            it("เมื่อเป็น MESSAGE จะต้องรักษา Case เดิมของข้อความไว้ ไม่ใช่แปลงเป็นตัวเล็กหมด", () => {
                const result = parseCommand("Hello WORLD");
                
                if (result.type === "MESSAGE") {
                    expect(result.content).toBe("Hello WORLD");
                } else {
                    expect(result.type as string).toBe("MESSAGE");
                }
            });
        });
    });
});
