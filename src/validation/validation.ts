// Regex for detecting invisible characters, zero-width spaces, and control characters
const INVISIBLE_OR_CONTROL_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u206F\u180E\u00AD\u2800\u0000-\u001F\u007F-\u009F]/u;
const INVISIBLE_STRIP_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u206F\u180E\u00AD\u2800\u0000-\u001F\u007F-\u009F]/gu;

// Regex for detecting emojis (Unicode Extended Pictographic, Emoji Presentation, Flags, etc.)
const EMOJI_REGEX = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}|\uFE0F/u;

// Allowed characters whitelist: English letters (a-z, A-Z), Numbers (0-9), Thai characters (\u0E00-\u0E7F), underscore (_), and hyphen (-)
const ALLOWED_USERNAME_REGEX = /^[a-zA-Z0-9_\-\u0E00-\u0E7F]+$/;

// Reserved words list for substring matching (normalized without '-' or '_')
const RESERVED_SUBSTRINGS = [
    "admin",
    "fackadmin",
    "fakeadmin",
    "system",
    "server",
    "root",
    "sysadmin",
    "superuser",
    "moderator",
    "null",
    "undefined"
];

// Reserved words list for exact matching
const RESERVED_EXACT_NAMES = new Set([
    "bot",
    "mod",
    "guest",
    "anonymous",
    "owner",
    "operator",
    "support",
    "staff",
    "helpdesk",
    "official"
]);

export const validateUsername = (
    username: unknown
): string | null => {
    // 1. Guard against null, undefined, and non-string types
    if (username === null || username === undefined || typeof username !== "string") {
        return "Username is required";
    }

    const value = username.trim();

    // 2. Reject blank/empty strings
    if (value.length === 0) {
        return "Username is required and cannot be blank";
    }

    // 3. Reject invisible characters / zero-width spaces / control characters
    if (INVISIBLE_OR_CONTROL_REGEX.test(username)) {
        return "Username cannot contain invisible characters or blank messages";
    }

    // 4. Reject emojis
    if (EMOJI_REGEX.test(value)) {
        return "Username cannot contain emojis";
    }

    // 5. Check character length (Array.from handles multi-byte/surrogate characters correctly)
    const charLength = Array.from(value).length;
    if (charLength < 3) {
        return "Username must be at least 3 characters";
    }
    if (charLength > 20) {
        return "Username must not exceed 20 characters";
    }

    // 6. Check for strange/disallowed special characters
    if (!ALLOWED_USERNAME_REGEX.test(value)) {
        return "Username contains invalid characters (only letters, numbers, Thai characters, underscores, and hyphens are allowed)";
    }

    // 7. Check for reserved/forbidden names (Admin, System, fackAdmin, etc.)
    const normalized = value.toLowerCase().replace(/[-_]/g, "");
    for (const reserved of RESERVED_SUBSTRINGS) {
        if (normalized.includes(reserved)) {
            return `Username cannot contain reserved name '${reserved}'`;
        }
    }

    const lowerExact = value.toLowerCase();
    if (RESERVED_EXACT_NAMES.has(lowerExact)) {
        return `Username '${value}' is reserved and not allowed`;
    }

    return null;
};

export const validateMessage = (
    message: unknown
): string | null => {
    if (message === null || message === undefined || typeof message !== "string") {
        return "Message cannot be empty";
    }

    // Strip invisible characters to check if message is effectively blank
    const stripped = message.replace(INVISIBLE_STRIP_REGEX, "").trim();
    if (stripped.length === 0) {
        return "Message cannot be empty or blank";
    }

    const charLength = Array.from(message.trim()).length;
    if (charLength > 500) {
        return "Message is too long";
    }

    return null;
};

export const sanitizeMessage = (
    message: unknown
): string => {
    if (typeof message !== "string") return "";
    return message.trim();
};