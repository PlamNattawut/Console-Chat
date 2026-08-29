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

    if (value === "/help") {
        return {
            type: "HELP"
        };
    }

    if (value === "/users") {
        return {
            type: "USERS"
        };
    }

    if (value === "/clear") {
        return {
            type: "CLEAR"
        };
    }

    if (value === "/quit") {
        return {
            type: "QUIT"
        };
    }

    return {
        type: "MESSAGE",
        content: value
    };
};