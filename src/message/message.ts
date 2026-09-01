import { Message } from "../contracts/message";

export const createMessage = (
    username: string,
    content: string
): Message => ({
    id: crypto.randomUUID(),
    username: (username ?? "").trim(),
    content: (content ?? "").trim(),
    timestamp: Date.now()
});

export const formatMessage = (
    message: Message
): string => {
    if (!message) return "";

    let time = "00:00:00";
    if (typeof message.timestamp === "number" && !isNaN(message.timestamp) && message.timestamp >= 0) {
        const date = new Date(message.timestamp);
        if (!isNaN(date.getTime())) {
            time = date.toLocaleTimeString();
        }
    }

    const username = (message.username ?? "").replace(/[\r\n]+/g, " ");
    const content = (message.content ?? "").replace(/[\r\n]+/g, " ");

    return `[${time}] ${username}: ${content}`;
};

export const formatMessages = (
    messages: Message[]
): string[] =>
    (messages || []).map(formatMessage);

export const filterMessages = (
    messages: Message[],
    keyword: string
): Message[] => {
    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
        return [];
    }

    const lowerKeyword = keyword.toLowerCase();
    return (messages || []).filter(message =>
        Boolean(
            message &&
            typeof message.content === "string" &&
            message.content.toLowerCase().includes(lowerKeyword)
        )
    );
};