import { describe, it, expect } from "bun:test";
import {
    validateUsername,
    validateMessage,
    sanitizeMessage
} from "../src/validation/validation";
import { isValidUsername, UserService } from "../src/user/UserService";

describe("การทดสอบระบบ Validation", () => {
    describe("การทำงานปกติ", () => {
        describe("1.1 การตรวจสอบชื่อผู้ใช้ที่ถูกต้องตามมาตรฐาน", () => {
            it("อนุญาตให้ใช้ชื่อผู้ใช้ที่เป็นตัวอักษรภาษาอังกฤษและตัวเลข เช่น 'Thanathon'", () => {
                expect(validateUsername("Thanathon")).toBeNull();
                expect(validateUsername("thanathon")).toBeNull();
                expect(validateUsername("THANATHON")).toBeNull();
                expect(validateUsername("Thanathon99")).toBeNull();
                expect(validateUsername("Thanathon_Dev")).toBeNull();
                expect(validateUsername("Thanathon-Pro")).toBeNull();
                expect(validateUsername("Dev_Thanathon")).toBeNull();
            });

            it("อนุญาตให้ใช้ชื่อผู้ใช้ทั่วไปที่มีเครื่องหมายขีดล่าง (_) และขีดกลาง (-)", () => {
                expect(validateUsername("john_doe")).toBeNull();
                expect(validateUsername("User123")).toBeNull();
                expect(validateUsername("super-dev")).toBeNull();
                expect(validateUsername("Alice")).toBeNull();
                expect(validateUsername("David99")).toBeNull();
                expect(validateUsername("CoolGamer")).toBeNull();
                expect(validateUsername("Alex_Smith")).toBeNull();
            });
        });

        describe("1.2 ขอบเขตความยาวของชื่อผู้ใช้ (3 - 20 ตัวอักษร)", () => {
            it("อนุญาตให้ใช้ชื่อที่มีความยาวต่ำสุดที่กำหนดพอดี (3 ตัวอักษร)", () => {
                expect(validateUsername("Dan")).toBeNull();
                expect(validateUsername("Sam")).toBeNull();
                expect(validateUsername("Ben")).toBeNull();
                expect(validateUsername("Max")).toBeNull();
                expect(validateUsername("Tom")).toBeNull();
            });

            it("อนุญาตให้ใช้ชื่อที่มีความยาวสูงสุดที่กำหนดพอดี (20 ตัวอักษร)", () => {
                expect(validateUsername("Thanathon_Super_2026")).toBeNull();
                expect(validateUsername("SuperThanathonDev_99")).toBeNull();
                expect(validateUsername("Thanathon_Master_Dev")).toBeNull();
            });
        });

        describe("1.3 ตัวอักษรซ้ำติดกันที่อนุญาต", () => {
            it("อนุญาตให้มีตัวอักษรซ้ำติดกันได้ไม่เกิน 2 ตัว เช่น 'Sammy', 'Anna', 'Cool'", () => {
                expect(validateUsername("Sammy")).toBeNull();
                expect(validateUsername("Tommy")).toBeNull();
                expect(validateUsername("Anna")).toBeNull();
                expect(validateUsername("Cool_Thanathon")).toBeNull();
                expect(validateUsername("Coffee_Lover")).toBeNull();
                expect(validateUsername("Manny_99")).toBeNull();
            });
        });

        describe("1.4 การตรวจสอบข้อความแชทที่ถูกต้อง", () => {
            it("อนุญาตให้ส่งข้อความภาษาอังกฤษ ตัวเลข และสัญลักษณ์ทั่วไป", () => {
                expect(validateMessage("Hello, my name is Thanathon!")).toBeNull();
                expect(validateMessage("How is everyone doing today?")).toBeNull();
                expect(validateMessage("12345 numbers and symbols !@#$%^&*()")).toBeNull();
            });

            it("อนุญาตให้ส่งข้อความภาษาไทยในแชทได้", () => {
                expect(validateMessage("สวัสดีครับ ผมธนธร")).toBeNull();
                expect(validateMessage("ยินดีต้อนรับสู่ห้องแชท")).toBeNull();
                expect(validateMessage("ทดสอบส่งข้อความภาษาไทย")).toBeNull();
            });

            it("อนุญาตให้ส่งข้อความที่มีความยาวตั้งแต่ 1 ถึง 500 ตัวอักษร", () => {
                expect(validateMessage("A")).toBeNull();
                expect(validateMessage("ก")).toBeNull();
                expect(validateMessage("A".repeat(500))).toBeNull();
            });
        });

        describe("1.5 การทำความสะอาดข้อความ (Sanitization)", () => {
            it("ตัดช่องว่างหน้าและหลังข้อความออกโดยอัตโนมัติ", () => {
                expect(sanitizeMessage("   Hello Thanathon!   ")).toBe("Hello Thanathon!");
                expect(sanitizeMessage("\t\nGood Morning\n\t")).toBe("Good Morning");
            });

            it("ส่งคืนค่าสตริงว่างหากข้อมูลนำเข้าไม่ใช่ข้อความ", () => {
                expect(sanitizeMessage(null)).toBe("");
                expect(sanitizeMessage(undefined)).toBe("");
                expect(sanitizeMessage(12345)).toBe("");
                expect(sanitizeMessage({})).toBe("");
            });
        });

        describe("1.6 การใช้งานร่วมกับ isValidUsername", () => {
            it("ส่งคืนค่า true เมื่อชื่อผู้ใช้ถูกต้องตามเกณฑ์", () => {
                expect(isValidUsername("Thanathon")).toBe(true);
                expect(isValidUsername("Thanathon_Dev")).toBe(true);
                expect(isValidUsername("Alice_99")).toBe(true);
                expect(isValidUsername("CoolPlayer")).toBe(true);
            });
        });
    });

    describe("การจัดการข้อผิดพลาดและขอบเขตข้อมูล", () => {
        describe("2.1 ความปลอดภัยของประเภทข้อมูลและค่าว่าง", () => {
            it("ปฏิเสธค่าที่เป็น null และ undefined", () => {
                expect(validateUsername(null)).toBe("Username is required");
                expect(validateUsername(undefined)).toBe("Username is required");
            });

            it("ปฏิเสธข้อมูลที่ไม่ใช่ประเภท string (เช่น ตัวเลข, boolean, array, object)", () => {
                expect(validateUsername(12345)).toBe("Username is required");
                expect(validateUsername(true)).toBe("Username is required");
                expect(validateUsername(false)).toBe("Username is required");
                expect(validateUsername([])).toBe("Username is required");
                expect(validateUsername({})).toBe("Username is required");
            });

            it("ควรตัดช่องว่างก่อนการตรวจสอบเพื่อป้องกันการปฏิเสธชื่อที่ถูกต้อง", () => {
                const result = validateUsername("  Thanathon  ");
                expect(result).toBeNull();
            });

            it("ปฏิเสธข้อความว่างและข้อความที่มีเฉพาะช่องว่าง", () => {
                expect(validateUsername("")).toBe("Username is required and cannot be blank");
                expect(validateUsername("   ")).toBe("Username is required and cannot be blank");
                expect(validateUsername("\t\t")).toBe("Username is required and cannot be blank");
                expect(validateUsername("\n\r")).toBe("Username is required and cannot be blank");
            });

            it("ฟังก์ชัน isValidUsername ส่งคืน false เมื่อได้รับข้อมูลไม่ถูกต้องหรือค่าว่าง", () => {
                expect(isValidUsername(null)).toBe(false);
                expect(isValidUsername(undefined)).toBe(false);
                expect(isValidUsername("")).toBe(false);
                expect(isValidUsername("   ")).toBe(false);
            });
        });

        describe("2.2 ขอบเขตความยาวชื่อผู้ใช้ที่ไม่ถูกต้อง", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่สั้นกว่า 3 ตัวอักษร", () => {
                expect(validateUsername("T")).toBe("Username must be at least 3 characters");
                expect(validateUsername("Th")).toBe("Username must be at least 3 characters");
                expect(validateUsername("a")).toBe("Username must be at least 3 characters");
                expect(validateUsername("ab")).toBe("Username must be at least 3 characters");
            });

            it("ปฏิเสธชื่อผู้ใช้ที่ยาวเกิน 20 ตัวอักษร", () => {
                expect(validateUsername("ThanathonThanathon123")).toBe("Username must not exceed 20 characters");
                expect(validateUsername("abcdefghijklmnopqrst1")).toBe("Username must not exceed 20 characters");
                expect(validateUsername("a".repeat(25))).toBe("Username must not exceed 20 characters");
            });
        });

        describe("2.3 อักขระพิเศษและสัญลักษณ์ที่ไม่อนุญาต", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่มีอักขระพิเศษ สัญลักษณ์ต้องห้าม และช่องว่าง", () => {
                expect(validateUsername("Thanathon@home")).toContain("invalid characters");
                expect(validateUsername("Thanathon!Dev")).toContain("invalid characters");
                expect(validateUsername("Thanathon#1")).toContain("invalid characters");
                expect(validateUsername("Thanathon Dev")).toContain("invalid characters");
                expect(validateUsername("Thanathon.Pro")).toContain("invalid characters");
                expect(validateUsername("$Thanathon")).toContain("invalid characters");
                expect(validateUsername("<Thanathon>")).toContain("invalid characters");
                expect(validateUsername("user/name")).toContain("invalid characters");
                expect(validateUsername("user+name")).toContain("invalid characters");
            });
        });

        describe("2.4 การจำกัดภาษาไทยในชื่อผู้ใช้", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่มีตัวอักษร สระ หรือวรรณยุกต์ภาษาไทย", () => {
                expect(validateUsername("ธนธร")).toBe("Username cannot contain Thai characters");
                expect(validateUsername("Thanathonไทย")).toBe("Username cannot contain Thai characters");
                expect(validateUsername("สมชาย")).toBe("Username cannot contain Thai characters");
                expect(validateUsername("ทดสอบ123")).toBe("Username cannot contain Thai characters");
                expect(validateUsername("ผู้ใช้งาน")).toBe("Username cannot contain Thai characters");
            });
        });

        describe("2.5 การจำกัดอิโมจิในชื่อผู้ใช้", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่มีอิโมจิทุกรูปแบบ", () => {
                expect(validateUsername("Thanathon🔥")).toBe("Username cannot contain emojis");
                expect(validateUsername("😀Thanathon")).toBe("Username cannot contain emojis");
                expect(validateUsername("🎉🎉🎉")).toBe("Username cannot contain emojis");
                expect(validateUsername("👋Hello")).toBe("Username cannot contain emojis");
                expect(validateUsername("Thanathon🇹🇭")).toBe("Username cannot contain emojis");
            });
        });

        describe("2.6 การจำกัดชื่อที่เป็นตัวเลขล้วน", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่เป็นตัวเลขล้วนหรือไม่มีตัวอักษรภาษาอังกฤษ", () => {
                expect(validateUsername("12345")).toBe("Username cannot be purely numbers and must contain English letters");
                expect(validateUsername("999999")).toBe("Username cannot be purely numbers and must contain English letters");
                expect(validateUsername("007")).toBe("Username cannot be purely numbers and must contain English letters");
                expect(validateUsername("123_456")).toBe("Username cannot be purely numbers and must contain English letters");
                expect(validateUsername("___---___")).toBe("Username cannot be purely numbers and must contain English letters");
            });
        });

        describe("2.7 การตรวจจับอักขระล่องหนและ Control Characters", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่มีอักขระล่องหนและรหัสควบคุม", () => {
                expect(validateUsername("\u200B\u200B\u200B")).toBe("Username cannot contain invisible characters or blank messages");
                expect(validateUsername("\uFEFFThanathon")).toBe("Username cannot contain invisible characters or blank messages");
                expect(validateUsername("Thanathon\u200DDev")).toBe("Username cannot contain invisible characters or blank messages");
                expect(validateUsername("\u2800\u2800\u2800")).toBe("Username cannot contain invisible characters or blank messages");
            });
        });

        describe("2.8 การจำกัดตัวอักษรซ้ำติดกันเกิน 2 ตัว", () => {
            it("ปฏิเสธชื่อผู้ใช้ที่มีตัวอักษรซ้ำติดกันตั้งแต่ 3 ตัวขึ้นไป", () => {
                expect(validateUsername("aaa")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("Thanathoooon")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("111Thanathon")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("coool")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("userxxxx")).toBe("Username cannot contain more than 2 consecutive identical characters");
            });

            it("ปฏิเสธตัวอักษรซ้ำติดกันโดยไม่สนใจตัวพิมพ์เล็กหรือตัวพิมพ์ใหญ่", () => {
                expect(validateUsername("AAa")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("aAA")).toBe("Username cannot contain more than 2 consecutive identical characters");
            });

            it("ปฏิเสธสัญลักษณ์ที่ซ้ำติดกันเกิน 2 ตัว เช่น '___' หรือ '---'", () => {
                expect(validateUsername("Thanathon___dev")).toBe("Username cannot contain more than 2 consecutive identical characters");
                expect(validateUsername("Thanathon---pro")).toBe("Username cannot contain more than 2 consecutive identical characters");
            });
        });

        describe("2.9 การตรวจจับข้อความขยะและการกดแป้นพิมพ์มั่ว", () => {
            it("ปฏิเสธการกดแป้นพิมพ์มั่วบนแถวแป้นพิมพ์หรือคำที่ไม่มีความหมาย", () => {
                expect(validateUsername("afs")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("sgs")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("aats")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("weqtwetsa")).toBe("Username cannot be random or gibberish text");
            });

            it("ปฏิเสธรูปแบบตัวอักษรสลับไปมาซ้ำๆ เช่น adada, ababa, xyxyx", () => {
                expect(validateUsername("adada")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("ababa")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("xyxyx")).toBe("Username cannot be random or gibberish text");
            });

            it("ปฏิเสธกลุ่มพยัญชนะล้วนที่ไม่มีสระ", () => {
                expect(validateUsername("gdasfddc232")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("bcdfghjk")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("asdfgh")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("qwer123")).toBe("Username cannot be random or gibberish text");
                expect(validateUsername("zxcvbn")).toBe("Username cannot be random or gibberish text");
            });
        });

        describe("2.10 การป้องกันชื่อสงวนและชื่อระบบ", () => {
            it("ปฏิเสธชื่อบทบาทสงวนที่ตรงกันทุกตัวอักษร", () => {
                expect(validateUsername("bot")).not.toBeNull();
                expect(validateUsername("mod")).not.toBeNull();
                expect(validateUsername("guest")).not.toBeNull();
                expect(validateUsername("anonymous")).not.toBeNull();
                expect(validateUsername("owner")).not.toBeNull();
                expect(validateUsername("staff")).not.toBeNull();
            });

            it("ปฏิเสธชื่อสงวนของระบบและคำที่เกี่ยวข้องกับแอดมิน", () => {
                expect(validateUsername("Admin")).not.toBeNull();
                expect(validateUsername("admin")).not.toBeNull();
                expect(validateUsername("ADMIN")).not.toBeNull();
                expect(validateUsername("Administrator")).not.toBeNull();
                expect(validateUsername("iam_admin")).not.toBeNull();
                expect(validateUsername("System")).not.toBeNull();
                expect(validateUsername("system_bot")).not.toBeNull();
                expect(validateUsername("Root")).not.toBeNull();
                expect(validateUsername("server_01")).not.toBeNull();
                expect(validateUsername("null")).not.toBeNull();
                expect(validateUsername("undefined")).not.toBeNull();
            });

            it("ปฏิเสธชื่อแอบอ้างแอดมินรูปแบบต่างๆ เช่น fackAdmin และ fakeAdmin", () => {
                expect(validateUsername("fackAdmin")).not.toBeNull();
                expect(validateUsername("fakeAdmin")).not.toBeNull();
                expect(validateUsername("fack_admin")).not.toBeNull();
                expect(validateUsername("fake_admin")).not.toBeNull();
            });
        });

        describe("2.11 การตรวจสอบข้อความแชทที่ไม่ถูกต้อง", () => {
            it("ปฏิเสธข้อความแชทที่เป็น null, undefined หรือไม่ใช่ string", () => {
                expect(validateMessage(null)).toBe("Message cannot be empty");
                expect(validateMessage(undefined)).toBe("Message cannot be empty");
                expect(validateMessage(12345)).toBe("Message cannot be empty");
                expect(validateMessage({})).toBe("Message cannot be empty");
            });

            it("ปฏิเสธข้อความแชทที่ว่างเปล่าหรือมีเฉพาะช่องว่าง", () => {
                expect(validateMessage("")).toBe("Message cannot be empty or blank");
                expect(validateMessage("   ")).toBe("Message cannot be empty or blank");
                expect(validateMessage("\t\t\n")).toBe("Message cannot be empty or blank");
            });

            it("ปฏิเสธข้อความแชทที่มีเฉพาะอักขระล่องหน", () => {
                expect(validateMessage("\u200B\u200B\u200B")).toBe("Message cannot be empty or blank");
                expect(validateMessage("\uFEFF\u200D\u2800")).toBe("Message cannot be empty or blank");
            });

            it("ปฏิเสธข้อความแชทที่มีความยาวเกิน 500 ตัวอักษร", () => {
                expect(validateMessage("A".repeat(501))).toBe("Message is too long");
            });
        });

        describe("2.12 การอนุญาตชื่อสากลที่ถูกต้องตามหลักภาษาอังกฤษ", () => {
            it("อนุญาตให้ใช้ชื่อสากลที่มีพยัญชนะติดกันหลายตัว เช่น Schmidt, Armstrong, Schwartz", () => {
                expect(validateUsername("Schmidt")).toBeNull();
                expect(validateUsername("Armstrong")).toBeNull();
                expect(validateUsername("Schwartz")).toBeNull();
                expect(validateUsername("Christoph")).toBeNull();
            });

            it("อนุญาตให้ใช้ชื่อสากลที่มีสระติดกัน เช่น Louise, Beau, Queenie", () => {
                expect(validateUsername("Louise")).toBeNull();
                expect(validateUsername("Beau")).toBeNull();
                expect(validateUsername("Queenie")).toBeNull();
            });

            it("อนุญาตให้ใช้คำศัพท์ปกติที่มีรูปแบบตัวอักษรซ้ำ เช่น Banana", () => {
                expect(validateUsername("Banana")).toBeNull();
            });
        });

        describe("2.13 การป้องกันการหลบเลี่ยงชื่อสงวนด้วยตัวเลขหรือคำต่อท้าย", () => {
            it("ปฏิเสธชื่อสงวนที่ต่อท้ายด้วยตัวเลขหรือคำอื่น เช่น bot1, mod_thanathon, staff_member, guest_1234", () => {
                expect(validateUsername("bot1")).not.toBeNull();
                expect(validateUsername("mod_thanathon")).not.toBeNull();
                expect(validateUsername("staff_member")).not.toBeNull();
                expect(validateUsername("guest_1234")).not.toBeNull();
            });

            it("ปฏิเสธชื่อที่ใช้ตัวเลขแทนตัวอักษร (Leetspeak) เช่น Adm1n, Syst3m, R00t", () => {
                expect(validateUsername("Adm1n")).not.toBeNull();
                expect(validateUsername("Syst3m")).not.toBeNull();
                expect(validateUsername("R00t_Master")).not.toBeNull();
                expect(validateUsername("s3rv3r_bot")).not.toBeNull();
            });
        });

        describe("2.14 ความสอดคล้องของข้อมูลระหว่าง Validation กับ UserService", () => {
            it("ชื่อผู้ใช้ที่ผ่าน validation ต้องถูกเก็บในระบบแบบตัดช่องว่างหน้า-หลังเรียบร้อย", () => {
                expect(validateUsername("  Thanathon  ")).toBeNull();

                const service = new UserService();
                const user = service.createUser("  Thanathon  ");
                expect(user.username).toBe("Thanathon");
            });
        });
    });
});
