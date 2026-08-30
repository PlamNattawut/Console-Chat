import { describe, it, expect } from "bun:test";
import { validateUsername, validateMessage } from "./validation";
import { UserService, isValidUsername } from "../user/UserService";

describe("validateUsername", () => {
    describe("1. Valid usernames", () => {
        it("allows valid English alphanumeric, underscore, and hyphen", () => {
            expect(validateUsername("john_doe")).toBeNull();
            expect(validateUsername("User123")).toBeNull();
            expect(validateUsername("super-dev")).toBeNull();
            expect(validateUsername("Alice")).toBeNull();
        });

        it("allows valid Thai usernames", () => {
            expect(validateUsername("สมชาย")).toBeNull();
            expect(validateUsername("มานี")).toBeNull();
            expect(validateUsername("ปลาวาฬ_01")).toBeNull();
        });

        it("allows usernames with valid boundary lengths (3 to 20 chars)", () => {
            expect(validateUsername("abc")).toBeNull();
            expect(validateUsername("12345678901234567890")).toBeNull();
            expect(validateUsername("กขค")).toBeNull();
        });
    });

    describe("2. Special / Weird character restrictions", () => {
        it("rejects special symbols and punctuation", () => {
            expect(validateUsername("john@doe")).toContain("invalid characters");
            expect(validateUsername("user!*#")).toContain("invalid characters");
            expect(validateUsername("$money")).toContain("invalid characters");
            expect(validateUsername("a+b=c")).toContain("invalid characters");
            expect(validateUsername("<script>")).toContain("invalid characters");
            expect(validateUsername("user/name")).toContain("invalid characters");
            expect(validateUsername("user.name")).toContain("invalid characters");
        });

        it("rejects spaces inside usernames", () => {
            expect(validateUsername("hello world")).toContain("invalid characters");
        });
    });

    describe("3. Length restrictions (Max 20 chars, Min 3 chars)", () => {
        it("rejects usernames shorter than 3 characters", () => {
            expect(validateUsername("a")).toBe("Username must be at least 3 characters");
            expect(validateUsername("ab")).toBe("Username must be at least 3 characters");
        });

        it("rejects usernames longer than 20 characters", () => {
            expect(validateUsername("a".repeat(21))).toBe("Username must not exceed 20 characters");
            expect(validateUsername("123456789012345678901")).toBe("Username must not exceed 20 characters");
        });
    });

    describe("4. Reserved and strange names (Admin, System, fackAdmin, etc.)", () => {
        it("rejects 'Admin' and case-insensitive variations", () => {
            expect(validateUsername("Admin")).not.toBeNull();
            expect(validateUsername("admin")).not.toBeNull();
            expect(validateUsername("ADMIN")).not.toBeNull();
            expect(validateUsername("Administrator")).not.toBeNull();
            expect(validateUsername("admin123")).not.toBeNull();
            expect(validateUsername("iam_admin")).not.toBeNull();
        });

        it("rejects 'System' and variations", () => {
            expect(validateUsername("System")).not.toBeNull();
            expect(validateUsername("system")).not.toBeNull();
            expect(validateUsername("SYSTEM")).not.toBeNull();
            expect(validateUsername("System_Bot")).not.toBeNull();
        });

        it("rejects 'fackAdmin', 'fakeAdmin', and variations", () => {
            expect(validateUsername("fackAdmin")).not.toBeNull();
            expect(validateUsername("fakeAdmin")).not.toBeNull();
            expect(validateUsername("fackadmin")).not.toBeNull();
            expect(validateUsername("fakeadmin")).not.toBeNull();
            expect(validateUsername("fack_admin")).not.toBeNull();
        });

        it("rejects other reserved names (root, server, null, undefined, bot, mod, guest)", () => {
            expect(validateUsername("Root")).not.toBeNull();
            expect(validateUsername("server")).not.toBeNull();
            expect(validateUsername("null")).not.toBeNull();
            expect(validateUsername("undefined")).not.toBeNull();
            expect(validateUsername("bot")).not.toBeNull();
            expect(validateUsername("mod")).not.toBeNull();
            expect(validateUsername("guest")).not.toBeNull();
            expect(validateUsername("anonymous")).not.toBeNull();
        });
    });

    describe("5. Emoji restrictions", () => {
        it("rejects usernames containing emojis", () => {
            expect(validateUsername("😀user")).toBe("Username cannot contain emojis");
            expect(validateUsername("user🔥")).toBe("Username cannot contain emojis");
            expect(validateUsername("🎉🎉🎉")).toBe("Username cannot contain emojis");
            expect(validateUsername("👋Hello")).toBe("Username cannot contain emojis");
        });
    });

    describe("6. Invisible characters and blank messages", () => {
        it("rejects zero-width and invisible characters", () => {
            expect(validateUsername("\u200B\u200B\u200B")).toBe("Username cannot contain invisible characters or blank messages");
            expect(validateUsername("\uFEFFuser")).toBe("Username cannot contain invisible characters or blank messages");
            expect(validateUsername("user\u200Dname")).toBe("Username cannot contain invisible characters or blank messages");
            expect(validateUsername("\u2800\u2800\u2800")).toBe("Username cannot contain invisible characters or blank messages");
        });

        it("rejects blank or whitespace-only inputs", () => {
            expect(validateUsername("")).toBe("Username is required and cannot be blank");
            expect(validateUsername("   ")).toBe("Username is required and cannot be blank");
            expect(validateUsername("\t\t")).toBe("Username is required and cannot be blank");
        });
    });

    describe("7. Null / Undefined safety without crash", () => {
        it("safely handles null and undefined without crashing", () => {
            expect(validateUsername(null)).toBe("Username is required");
            expect(validateUsername(undefined)).toBe("Username is required");
        });

        it("safely handles non-string types without crashing", () => {
            expect(validateUsername(123)).toBe("Username is required");
            expect(validateUsername({})).toBe("Username is required");
            expect(validateUsername([])).toBe("Username is required");
            expect(validateUsername(true)).toBe("Username is required");
        });
    });
});

describe("validateMessage", () => {
    it("allows valid chat messages", () => {
        expect(validateMessage("Hello world!")).toBeNull();
        expect(validateMessage("สวัสดีครับ")).toBeNull();
    });

    it("rejects null or undefined messages", () => {
        expect(validateMessage(null)).toBe("Message cannot be empty");
        expect(validateMessage(undefined)).toBe("Message cannot be empty");
    });

    it("rejects empty or invisible-only messages", () => {
        expect(validateMessage("")).toBe("Message cannot be empty or blank");
        expect(validateMessage("   ")).toBe("Message cannot be empty or blank");
        expect(validateMessage("\u200B\u200B\u200B")).toBe("Message cannot be empty or blank");
    });

    it("rejects messages exceeding 500 characters", () => {
        expect(validateMessage("a".repeat(501))).toBe("Message is too long");
    });
});

describe("UserService & isValidUsername integration", () => {
    it("validates using isValidUsername correctly", () => {
        expect(isValidUsername("ValidUser")).toBe(true);
        expect(isValidUsername("Admin")).toBe(false);
        expect(isValidUsername(null)).toBe(false);
        expect(isValidUsername(undefined)).toBe(false);
    });

    it("UserService handles null / undefined searches safely", () => {
        const service = new UserService();
        service.createUser("TestUser");

        expect(service.isUsernameTaken(null)).toBe(false);
        expect(service.isUsernameTaken(undefined)).toBe(false);
        expect(service.getUserByUsername(null)).toBeUndefined();
        expect(service.getUserByUsername(undefined)).toBeUndefined();
        expect(service.isUsernameTaken("TestUser")).toBe(true);
    });
});
