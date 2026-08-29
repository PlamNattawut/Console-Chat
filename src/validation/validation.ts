export const validateUsername = (
    username: string
): string | null => {

    const value = username.trim();

    if (value.length === 0) {
        return "Username is required";
    }

    if (value.length < 3) {
        return "Username must be at least 3 characters";
    }

    if (value.length > 20) {
        return "Username must not exceed 20 characters";
    }

    return null;
};

export const validateMessage = (
    message: string
): string | null => {

    const value = message.trim();

    if (value.length === 0) {
        return "Message cannot be empty";
    }

    if (value.length > 500) {
        return "Message is too long";
    }

    return null;
};

export const sanitizeMessage = (
    message: string
): string =>
    message.trim();