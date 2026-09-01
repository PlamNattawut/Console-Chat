import fs from "fs";
import { Message } from "../contracts/message";
import { LogService as ILogService } from "../contracts/log";
import { formatMessage } from "../message/message";

export class FileLogService implements ILogService {
    private readonly history: Message[] = [];
    private readonly maxHistory: number = 100;

    constructor(private readonly filePath: string = "./chat.log") {}

    save(message: Message): void {
        if (!message || typeof message !== "object" || !message.id) {
            return;
        }

        const cloned: Message = { ...message };
        this.history.push(cloned);

        while (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        if (this.filePath) {
            try {
                const logLine = formatMessage(message) + "\n";
                fs.appendFileSync(this.filePath, logLine, "utf-8");
            } catch (error) {
                // Ignore file write errors gracefully
            }
        }
    }

    getHistory(): Message[] {
        return this.history.map(msg => ({ ...msg }));
    }
}