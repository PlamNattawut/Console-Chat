import { Message } from "./message";

export interface LogService {
    save(message: Message): void;
    getHistory(): Message[];
}