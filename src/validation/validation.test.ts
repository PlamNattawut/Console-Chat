import { describe, it, expect } from "bun:test";
import { validateUsername, validateMessage, isGibberish } from "./validation";
import { UserService, isValidUsername } from "../user/UserService";
import { parseCommand } from "../command/command";

describe("validateUsername", () => {
    describe("1. Valid usernames", () => {
        it("allows valid English alphanumeric, underscore, and hyphen", () => {
            expect(validateUsername("john_doe")).toBeNull();
            expect(validateUsername("User123")).toBeNull();
            expect(validateUsername("super-dev")).toBeNull();
            expect(validateUsername("Alice")).toBeNull();
            expect(validateUsername("David99")).toBeNull();
            expect(validateUsername("CoolGamer")).toBeNull();
            expect(validateUsername("Sammy")).toBeNull();
            expect(validateUsername("Tommy")).toBeNull();
            expect(validateUsername("Anna")).toBeNull();
            expect(validateUsername("Aaron")).toBeNull();
        });

        it("allows usernames with valid boundary lengths (3 to 20 chars)", () => {
            expect(validateUsername("Sam")).toBeNull();
            expect(validateUsername("Ben")).toBeNull();
            expect(validateUsername("Max")).toBeNull();
            expect(validateUsername("SuperGamer2024_Pro")).toBeNull();
        });
    });

    describe("2. Non-name / Gibberish restriction (ตั้งชื่อไม่เป็นชื่อไม่ได้ เช่น afs, sgs, aats, weqtwetsa)", () => {
        it("rejects non-names like 'afs', 'sgs', 'aats', 'weqtwetsa'", () => {
            expect(validateUsername("afs")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("sgs")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("aats")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("weqtwetsa")).toBe("Username cannot be random or gibberish text");
        });

        it("rejects alternating repeating patterns like 'adada'", () => {
            expect(validateUsername("adada")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("ababa")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("xyxyx")).toBe("Username cannot be random or gibberish text");
        });

        it("rejects keyboard smash / consonant clusters like 'gdasfddc232'", () => {
            expect(validateUsername("gdasfddc232")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("bcdfghjk")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("asdfgh")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("qwer123")).toBe("Username cannot be random or gibberish text");
            expect(validateUsername("zxcvbn")).toBe("Username cannot be random or gibberish text");
        });
    });

    describe("3. Consecutive characters limit changed from 3 to 2 (ซ้ำเกิน 2 ตัวติดกันไม่ได้)", () => {
        it("rejects more than 2 consecutive identical characters (e.g. aaa, ooo, eeee)", () => {
            expect(validateUsername("aaa")).toBe("Username cannot contain more than 2 consecutive identical characters");
            expect(validateUsername("coool")).toBe("Username cannot contain more than 2 consecutive identical characters");
            expect(validateUsername("aaaagww")).toBe("Username cannot contain more than 2 consecutive identical characters");
            expect(validateUsername("ssgeeeecdfg")).toBe("Username cannot contain more than 2 consecutive identical characters");
            expect(validateUsername("userxxxx")).toBe("Username cannot contain more than 2 consecutive identical characters");
            expect(validateUsername("111player")).toBe("Username cannot contain more than 2 consecutive identical characters");
        });

        it("allows up to 2 consecutive identical characters (e.g. Sammy, Tommy, Anna, Cool)", () => {
            expect(validateUsername("Sammy")).toBeNull();
            expect(validateUsername("Tommy")).toBeNull();
            expect(validateUsername("Anna")).toBeNull();
            expect(validateUsername("Cool_Dev")).toBeNull();
        });
    });

    describe("4. Pure numbers restriction (ตั้งชื่อเป็นตัวเลขไม่ได้)", () => {
        it("rejects purely numeric usernames or usernames with no English letters", () => {
            expect(validateUsername("12345")).toBe("Username cannot be purely numbers and must contain English letters");
            expect(validateUsername("999")).toBe("Username cannot be purely numbers and must contain English letters");
            expect(validateUsername("007")).toBe("Username cannot be purely numbers and must contain English letters");
            expect(validateUsername("123_456")).toBe("Username cannot be purely numbers and must contain English letters");
        });

        it("allows alphanumeric usernames containing both letters and numbers", () => {
            expect(validateUsername("Player1")).toBeNull();
            expect(validateUsername("Alex99")).toBeNull();
            expect(validateUsername("dev_01")).toBeNull();
        });
    });

    describe("5. Thai language restriction (ตั้งชื่อภาษาไทยไม่ได้)", () => {
        it("rejects Thai characters in username", () => {
            expect(validateUsername("สมชาย")).toBe("Username cannot contain Thai characters");
            expect(validateUsername("ภาษาไทย")).toBe("Username cannot contain Thai characters");
            expect(validateUsername("ทดสอบ123")).toBe("Username cannot contain Thai characters");
            expect(validateUsername("userไทย")).toBe("Username cannot contain Thai characters");
        });
    });

    describe("6. Special / Weird character restrictions", () => {
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

    describe("7. Length restrictions (Max 20 chars, Min 3 chars)", () => {
        it("rejects usernames shorter than 3 characters", () => {
            expect(validateUsername("a")).toBe("Username must be at least 3 characters");
            expect(validateUsername("ab")).toBe("Username must be at least 3 characters");
        });

        it("rejects usernames longer than 20 characters", () => {
            expect(validateUsername("abcdefghijklmnopqrst1")).toBe("Username must not exceed 20 characters");
        });
    });

    describe("8. Reserved and strange names (Admin, System, fackAdmin, etc.)", () => {
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

    describe("9. Emoji restrictions", () => {
        it("rejects usernames containing emojis", () => {
            expect(validateUsername("😀user")).toBe("Username cannot contain emojis");
            expect(validateUsername("user🔥")).toBe("Username cannot contain emojis");
            expect(validateUsername("🎉🎉🎉")).toBe("Username cannot contain emojis");
            expect(validateUsername("👋Hello")).toBe("Username cannot contain emojis");
        });
    });

    describe("10. Invisible characters and blank messages", () => {
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

    describe("11. Null / Undefined safety without crash", () => {
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

describe("Case-Insensitive Commands (parseCommand)", () => {
    it("handles /help in lowercase, uppercase, and mixed case", () => {
        expect(parseCommand("/help")).toEqual({ type: "HELP" });
        expect(parseCommand("/HELP")).toEqual({ type: "HELP" });
        expect(parseCommand("/Help")).toEqual({ type: "HELP" });
        expect(parseCommand("/hElP")).toEqual({ type: "HELP" });
    });

    it("handles /quit in lowercase, uppercase, and mixed case", () => {
        expect(parseCommand("/quit")).toEqual({ type: "QUIT" });
        expect(parseCommand("/QUIT")).toEqual({ type: "QUIT" });
        expect(parseCommand("/Quit")).toEqual({ type: "QUIT" });
    });

    it("handles /users in lowercase, uppercase, and mixed case", () => {
        expect(parseCommand("/users")).toEqual({ type: "USERS" });
        expect(parseCommand("/USERS")).toEqual({ type: "USERS" });
        expect(parseCommand("/Users")).toEqual({ type: "USERS" });
    });

    it("handles /clear in lowercase, uppercase, and mixed case", () => {
        expect(parseCommand("/clear")).toEqual({ type: "CLEAR" });
        expect(parseCommand("/CLEAR")).toEqual({ type: "CLEAR" });
        expect(parseCommand("/Clear")).toEqual({ type: "CLEAR" });
    });

    it("treats regular messages as MESSAGE type", () => {
        expect(parseCommand("Hello everyone")).toEqual({ type: "MESSAGE", content: "Hello everyone" });
    });
});

describe("UserService & isValidUsername integration", () => {
    it("validates using isValidUsername correctly", () => {
        expect(isValidUsername("ValidUser")).toBe(true);
        expect(isValidUsername("12345")).toBe(false);
        expect(isValidUsername("adada")).toBe(false);
        expect(isValidUsername("afs")).toBe(false);
        expect(isValidUsername("sgs")).toBe(false);
        expect(isValidUsername("aats")).toBe(false);
        expect(isValidUsername("weqtwetsa")).toBe(false);
        expect(isValidUsername("Admin")).toBe(false);
        expect(isValidUsername("สมชาย")).toBe(false);
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
