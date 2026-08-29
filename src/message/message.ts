import { Message } from "../contracts/message";

export const createMessage = (
    username: string,
    content: string
): Message => ({
    id: crypto.randomUUID(),
    username,
    content,
    timestamp: Date.now()
});

export const formatMessage = (
    message: Message
): string => {

    const time = new Date(
        message.timestamp
    ).toLocaleTimeString();

    return `[${time}] ${message.username}: ${message.content}`;
};

export const formatMessages = (
    messages: Message[]
): string[] =>
    messages.map(formatMessage);

export const filterMessages = (
    messages: Message[],
    keyword: string
): Message[] =>
    messages.filter(message =>
        message.content
            .toLowerCase()
            .includes(keyword.toLowerCase())
    );