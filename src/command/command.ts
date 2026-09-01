export type Command =
    | {
        type: "HELP";
    }
    | {
        type: "USERS";
    }
    | {
        type: "CLEAR";
    }
    | {
        type: "QUIT";
    }
    | {
        type: "UNKNOWN";
        command?: string;
    }
    | {
        type: "MESSAGE";
        content: string;
    };

export const parseCommand = (
    input: string
): Command => {
    if (typeof input !== "string") {
        return {
            type: "MESSAGE",
            content: ""
        };
    }

    const value = input.trim();
    const lower = value.toLowerCase();

    if (lower.startsWith("/")) {
        if (lower === "/help" || lower.startsWith("/help ")) {
            return {
                type: "HELP"
            };
        }

        if (lower === "/users" || lower.startsWith("/users ")) {
            return {
                type: "USERS"
            };
        }

        if (lower === "/clear" || lower.startsWith("/clear ")) {
            return {
                type: "CLEAR"
            };
        }

        if (lower === "/quit" || lower.startsWith("/quit ")) {
            return {
                type: "QUIT"
            };
        }

        return {
            type: "UNKNOWN",
            command: value
        };
    }

    return {
        type: "MESSAGE",
        content: value
    };
};