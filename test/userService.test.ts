import { describe, it, expect, beforeEach } from "bun:test";
import { UserService } from "../src/user/UserService";

describe("การทดสอบระบบจัดการผู้ใช้ (UserService)", () => {
    let service: UserService;

    beforeEach(() => {
        service = new UserService();
    });

    describe("การทำงานปกติ", () => {
        describe("1.1 การสร้างผู้ใช้ (createUser)", () => {
            it("สร้างผู้ใช้ที่มี id และ username ครบถ้วน", () => {
                const user = service.createUser("Thanathon");

                expect(user.id).toBeDefined();
                expect(user.id.length).toBeGreaterThan(0);
                expect(user.username).toBe("Thanathon");
            });

            it("สร้างผู้ใช้หลายคนที่มี id ไม่ซ้ำกัน", () => {
                const user1 = service.createUser("Thanathon");
                const user2 = service.createUser("Alice");
                const user3 = service.createUser("Bob");

                expect(user1.id).not.toBe(user2.id);
                expect(user2.id).not.toBe(user3.id);
                expect(user1.id).not.toBe(user3.id);
            });
        });

        describe("1.2 การค้นหาผู้ใช้ด้วย ID (getUser)", () => {
            it("ค้นหาผู้ใช้ที่มีอยู่ในระบบด้วย id ได้สำเร็จ", () => {
                const created = service.createUser("Thanathon");
                const found = service.getUser(created.id);

                expect(found).toBeDefined();
                expect(found?.username).toBe("Thanathon");
                expect(found?.id).toBe(created.id);
            });

            it("ส่งคืน undefined เมื่อค้นหาด้วย id ที่ไม่มีอยู่ในระบบ", () => {
                expect(service.getUser("nonexistent-id")).toBeUndefined();
            });
        });

        describe("1.3 การค้นหาผู้ใช้ด้วยชื่อ (getUserByUsername)", () => {
            it("ค้นหาผู้ใช้ด้วยชื่อที่ตรงกันได้สำเร็จ", () => {
                service.createUser("Thanathon");
                const found = service.getUserByUsername("Thanathon");

                expect(found).toBeDefined();
                expect(found?.username).toBe("Thanathon");
            });

            it("ค้นหาแบบ case-insensitive ได้ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)", () => {
                service.createUser("Thanathon");

                expect(service.getUserByUsername("thanathon")).toBeDefined();
                expect(service.getUserByUsername("THANATHON")).toBeDefined();
                expect(service.getUserByUsername("tHaNaThOn")).toBeDefined();
            });

            it("ส่งคืน undefined เมื่อค้นหาชื่อที่ไม่มีอยู่ในระบบ", () => {
                service.createUser("Thanathon");

                expect(service.getUserByUsername("NonExistent")).toBeUndefined();
            });
        });

        describe("1.4 การตรวจสอบชื่อซ้ำ (isUsernameTaken)", () => {
            it("ส่งคืน true เมื่อชื่อถูกใช้งานแล้ว", () => {
                service.createUser("Thanathon");

                expect(service.isUsernameTaken("Thanathon")).toBe(true);
            });

            it("ตรวจสอบแบบ case-insensitive ได้", () => {
                service.createUser("Thanathon");

                expect(service.isUsernameTaken("thanathon")).toBe(true);
                expect(service.isUsernameTaken("THANATHON")).toBe(true);
            });

            it("ส่งคืน false เมื่อชื่อยังไม่ถูกใช้งาน", () => {
                expect(service.isUsernameTaken("Thanathon")).toBe(false);
            });
        });

        describe("1.5 การลบผู้ใช้ (removeUser)", () => {
            it("ลบผู้ใช้ออกจากระบบสำเร็จ ส่งคืน true", () => {
                const user = service.createUser("Thanathon");
                const result = service.removeUser(user.id);

                expect(result).toBe(true);
                expect(service.getUser(user.id)).toBeUndefined();
            });

            it("หลังลบแล้ว ชื่อนั้นกลับมาใช้งานได้อีก", () => {
                const user = service.createUser("Thanathon");
                service.removeUser(user.id);

                expect(service.isUsernameTaken("Thanathon")).toBe(false);
            });

            it("ส่งคืน false เมื่อลบ id ที่ไม่มีอยู่ในระบบ", () => {
                expect(service.removeUser("nonexistent-id")).toBe(false);
            });
        });

        describe("1.6 การดึงผู้ใช้ทั้งหมด (getAllUsers)", () => {
            it("ส่งคืนรายชื่อผู้ใช้ทั้งหมดในระบบ", () => {
                service.createUser("Thanathon");
                service.createUser("Alice");
                service.createUser("Bob");

                const users = service.getAllUsers();

                expect(users).toHaveLength(3);
                const usernames = users.map(u => u.username);
                expect(usernames).toContain("Thanathon");
                expect(usernames).toContain("Alice");
                expect(usernames).toContain("Bob");
            });

            it("ส่งคืนอาร์เรย์ว่างเมื่อยังไม่มีผู้ใช้", () => {
                expect(service.getAllUsers()).toEqual([]);
            });

            it("อาร์เรย์ที่คืนมาต้องเป็นสำเนา (ไม่ใช่ reference เดิม) เพื่อป้องกันข้อมูลภายในถูกแก้ไข", () => {
                service.createUser("Thanathon");
                const users = service.getAllUsers();
                users.push({ id: "fake-id", username: "Hacker" });

                expect(service.getAllUsers()).toHaveLength(1);
            });
        });
    });

    describe("การจัดการข้อผิดพลาดและขอบเขตข้อมูล", () => {
        describe("2.1 การสร้างผู้ใช้ต้องตรวจสอบชื่อซ้ำก่อนเก็บ", () => {
            it("ต้องไม่อนุญาตให้สร้างผู้ใช้ที่มีชื่อซ้ำกัน (แม้ต่างตัวพิมพ์)", () => {
                service.createUser("Thanathon");
                const duplicate = service.createUser("thanathon");

                const allUsers = service.getAllUsers();
                const thanathonUsers = allUsers.filter(
                    u => u.username.toLowerCase() === "thanathon"
                );
                expect(thanathonUsers).toHaveLength(1);
            });
        });

        describe("2.2 createUser ต้อง trim ข้อมูลก่อนเก็บ", () => {
            it("ต้องตัดช่องว่างหน้า-หลังออกจากชื่อผู้ใช้ก่อนเก็บ", () => {
                const user = service.createUser("  Thanathon  ");

                expect(user.username).toBe("Thanathon");
            });

            it("ชื่อที่มีช่องว่างต้องค้นหาได้เหมือนชื่อปกติ", () => {
                service.createUser("  Thanathon  ");

                expect(service.isUsernameTaken("Thanathon")).toBe(true);
                expect(service.getUserByUsername("Thanathon")).toBeDefined();
            });
        });

        describe("2.3 getUserByUsername ต้องจัดการค่าผิดปกติ", () => {
            it("ส่งคืน undefined เมื่อค้นหาด้วย null, undefined หรือค่าว่าง", () => {
                expect(service.getUserByUsername(null)).toBeUndefined();
                expect(service.getUserByUsername(undefined)).toBeUndefined();
                expect(service.getUserByUsername("")).toBeUndefined();
                expect(service.getUserByUsername("   ")).toBeUndefined();
            });
        });

        describe("2.4 isUsernameTaken ต้องจัดการค่าผิดปกติ", () => {
            it("ส่งคืน false เมื่อตรวจสอบด้วย null, undefined หรือค่าว่าง", () => {
                service.createUser("Thanathon");

                expect(service.isUsernameTaken(null)).toBe(false);
                expect(service.isUsernameTaken(undefined)).toBe(false);
                expect(service.isUsernameTaken("")).toBe(false);
            });
        });

        describe("2.5 สถานะของระบบหลังการลบต้องสอดคล้องกัน", () => {
            it("หลังลบผู้ใช้ จำนวนผู้ใช้ทั้งหมดต้องลดลงถูกต้อง", () => {
                const u1 = service.createUser("Thanathon");
                service.createUser("Alice");
                service.createUser("Bob");

                expect(service.getAllUsers()).toHaveLength(3);

                service.removeUser(u1.id);
                expect(service.getAllUsers()).toHaveLength(2);

                const usernames = service.getAllUsers().map(u => u.username);
                expect(usernames).not.toContain("Thanathon");
                expect(usernames).toContain("Alice");
                expect(usernames).toContain("Bob");
            });

            it("ลบผู้ใช้คนเดิมซ้ำสองรอบ รอบที่สองต้องคืน false", () => {
                const user = service.createUser("Thanathon");

                expect(service.removeUser(user.id)).toBe(true);
                expect(service.removeUser(user.id)).toBe(false);
            });
        });

        describe("2.6 การแก้ไข User object จากภายนอกต้องไม่กระทบข้อมูลภายใน", () => {
            it("แก้ไข username ของ object ที่ return มา ต้องไม่เปลี่ยนข้อมูลในระบบ", () => {
                const user = service.createUser("Thanathon");
                user.username = "Hacker";

                const found = service.getUser(user.id);
                expect(found?.username).toBe("Thanathon");
            });
        });

        describe("2.7 ประสิทธิภาพการค้นหา (Performance)", () => {
            it("ควรมีกลไกค้นหาชื่อผู้ใช้แบบ O(1) เพื่อไม่ให้ประสิทธิภาพตกลงเมื่อมีผู้ใช้จำนวนมาก", () => {
                for (let i = 0; i < 5000; i++) {
                    service.createUser(`User${i}`);
                }

                const startTime = performance.now();
                service.getUserByUsername("User4999");
                const endTime = performance.now();

                const executionTimeMs = endTime - startTime;
                
                expect(executionTimeMs).toBeLessThan(1);
            });
        });
    });
});
