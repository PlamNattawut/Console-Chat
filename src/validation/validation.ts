// Regex for detecting invisible characters, zero-width spaces, and control characters
const INVISIBLE_OR_CONTROL_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u206F\u180E\u00AD\u2800\u0000-\u001F\u007F-\u009F]/u;
const INVISIBLE_STRIP_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u206F\u180E\u00AD\u2800\u0000-\u001F\u007F-\u009F]/gu;

// Regex for detecting emojis (Unicode Extended Pictographic, Emoji Presentation, Flags, etc.)
const EMOJI_REGEX = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}|\uFE0F/u;

// Regex for detecting Thai characters
const THAI_REGEX = /[\u0E00-\u0E7F]/;

// Allowed characters whitelist: English letters (a-z, A-Z), Numbers (0-9), underscore (_), and hyphen (-)
const ALLOWED_USERNAME_REGEX = /^[a-zA-Z0-9_\-]+$/;

// Regex for detecting more than 2 consecutive identical characters (e.g. aaa, ooo, eeee)
const CONSECUTIVE_IDENTICAL_REGEX = /(.)\1{2,}/i;

// Regex for detecting 4 or more consecutive consonants
const CONSECUTIVE_CONSONANTS_REGEX = /[bcdfghjklmnpqrstvwxz]{4,}/i;

// Regex for detecting 3 or more consecutive vowels
const CONSECUTIVE_VOWELS_REGEX = /[aeiou]{3,}/i;

// Regex for alternating repeating patterns (e.g. adada, ababa, xyxyx)
const ALTERNATING_PATTERN_REGEX = /([a-z])([a-z])\1\2\1/i;

// Unnatural onset patterns (e.g. aa not followed by ron/liyah like aats, aaf)
const UNNATURAL_DOUBLE_VOWEL_ONSET = /^aa(?!ron|liyah)/i;

// Phonotactically impossible consonant pairs in names (e.g. 'qt' in weqtwetsa)
const IMPOSSIBLE_CONSONANT_PAIRS = /(qt|qf|qk|qp|qj|qz|qx|qc|qv|qb|qm|qn|qg|qd|qs|wq|vq|xq|zq|jq|fq|gq|dq|tq|pq|bq|kq|dx|fx|gx|hx|jx|kx|px|tx|vx|zx|cf|fc|vg|gv|hx|xh|zx|xz|cx|xc|bx|xb)/i;

// 3-letter home-row mashes and invalid coda patterns (e.g. afs, sgs, asf, fda, dsf, etc.)
const INVALID_3_LETTER_MASH = /^(afs|sgs|asf|fda|fad|dsf|sdf|dfg|fgh|ghj|hjk|jkl|lkj|kjh|jhg|hgf|gfd|fds|dsa|saf|fsa|gda|gds|dsg|hsg|jds|kfd|lks|zxc|xcv|cvb|vbn|bnm|qwe|wer|ert|rty|tyu|yui|uio|iop|poi|oiu|iuy|uyt|ytr|tre|rew|ewq)$/i;

// Common keyboard walk sequences and home-row smashes (length >= 4)
const KEYBOARD_WALKS = [
    "asdf", "fdsa", "qwer", "rewq", "zxcv", "vcxz",
    "hjkl", "lkjh", "ghjk", "kjhg", "dfgh", "hgfd",
    "sdfg", "gfds", "erty", "ytre", "rtyu", "uytr",
    "tyui", "iuyt", "yuio", "oiuy", "uiop", "poiu",
    "xcvb", "bvcz", "cvbn", "nbvc", "vbnm", "mnbv",
    "dasf", "fasd", "fsda", "sfda", "dsaf", "adfs", "afds", "dafs", "fads",
    "weqt", "twet", "qtw"
];

// Left-hand only keyboard keys
const LEFT_HAND_KEYS = new Set("qwertasedfgzxcv".split(""));

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

// Check if string is gibberish or keyboard smash
export const isGibberish = (name: string): boolean => {
    const lower = name.toLowerCase();
    const lettersOnly = lower.replace(/[^a-z]/g, "");

    // 1. Must contain at least one vowel (a, e, i, o, u, y) - catches 'sgs', 'zxc', 'dfg'
    const vowels = lettersOnly.match(/[aeiouy]/g);
    if (!vowels || vowels.length === 0) {
        return true;
    }

    // 2. 3-letter specific keyboard mash check (e.g. afs, sgs, asf)
    if (lettersOnly.length === 3 && INVALID_3_LETTER_MASH.test(lettersOnly)) {
        return true;
    }

    // 3. Unnatural double-vowel onsets (e.g. aats, aaf)
    if (UNNATURAL_DOUBLE_VOWEL_ONSET.test(lettersOnly)) {
        return true;
    }

    // 4. Alternating repeating patterns (e.g. adada, ababa, cdcdc)
    if (ALTERNATING_PATTERN_REGEX.test(lower)) {
        return true;
    }

    // 5. Phonotactically impossible consonant clusters/pairs (e.g. 'qt' in weqtwetsa)
    if (IMPOSSIBLE_CONSONANT_PAIRS.test(lettersOnly)) {
        return true;
    }

    // 6. Keyboard walk sequences or home-row smashes
    for (const walk of KEYBOARD_WALKS) {
        if (lower.includes(walk)) {
            return true;
        }
    }

    // 7. Excessive consecutive consonants (>= 4 consonants in a row, e.g. sfddc in gdasfddc232)
    if (CONSECUTIVE_CONSONANTS_REGEX.test(lower)) {
        return true;
    }

    // 8. Excessive consecutive vowels (>= 3 vowels in a row, e.g. aeiou)
    if (CONSECUTIVE_VOWELS_REGEX.test(lower)) {
        return true;
    }

    // 9. Left-hand only keyboard mashes of length >= 6 (e.g. weqtwetsa, asdfrew)
    if (lettersOnly.length >= 6) {
        let allLeftHand = true;
        for (const char of lettersOnly) {
            if (!LEFT_HAND_KEYS.has(char)) {
                allLeftHand = false;
                break;
            }
        }
        if (allLeftHand) {
            const uniqueChars = new Set(lettersOnly.split("")).size;
            if (uniqueChars <= 6 && lettersOnly.length >= 7) {
                return true;
            }
        }
    }

    return false;
};

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

    // 5. Reject Thai characters
    if (THAI_REGEX.test(value)) {
        return "Username cannot contain Thai characters";
    }

    // 6. Check for strange/disallowed special characters (English letters, numbers, _, -)
    if (!ALLOWED_USERNAME_REGEX.test(value)) {
        return "Username contains invalid characters (only English letters, numbers, underscores, and hyphens are allowed)";
    }

    // 7. Check character length
    const charLength = Array.from(value).length;
    if (charLength < 3) {
        return "Username must be at least 3 characters";
    }
    if (charLength > 20) {
        return "Username must not exceed 20 characters";
    }

    // 8. Reject purely numeric usernames (must contain at least one English letter)
    if (!/[a-zA-Z]/.test(value)) {
        return "Username cannot be purely numbers and must contain English letters";
    }

    // 9. Reject more than 2 consecutive identical characters (e.g. aaa, ooo, eeee)
    if (CONSECUTIVE_IDENTICAL_REGEX.test(value)) {
        return "Username cannot contain more than 2 consecutive identical characters";
    }

    // 10. Reject gibberish / non-name text (e.g. afs, sgs, aats, weqtwetsa, adada, gdasfddc232)
    if (isGibberish(value)) {
        return "Username cannot be random or gibberish text";
    }

    // 11. Check for reserved/forbidden names (Admin, System, fackAdmin, etc.)
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