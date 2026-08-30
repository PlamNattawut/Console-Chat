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
        type: "MESSAGE";
        content: string;
    };

export const parseCommand = (
    input: string
): Command => {

    const value = input.trim();
    const lower = value.toLowerCase();

    if (lower === "/help") {
        return {
            type: "HELP"
        };
    }

    if (lower === "/users") {
        return {
            type: "USERS"
        };
    }

    if (lower === "/clear") {
        return {
            type: "CLEAR"
        };
    }

    if (lower === "/quit") {
        return {
            type: "QUIT"
        };
    }

    return {
        type: "MESSAGE",
        content: value
    };
};