export interface Message {
    id: string;
    username: string;
    content: string;
    timestamp: number;
}

export type ClientAction =
    | { type: "JOIN"; username?: string }
    | { type: "MESSAGE"; content?: string }
    | { type: "GET_USERS" }
    | { type: "PONG" };

export type ServerEvent =
    | { type: "JOIN_RESPONSE"; success: boolean; user?: { id: string; username: string }; error?: string }
    | { type: "MESSAGE"; message: Message }
    | { type: "SYSTEM"; content: string }
    | { type: "USERS_LIST"; users: string[] }
    | { type: "PING" };