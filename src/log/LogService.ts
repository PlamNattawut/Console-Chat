import fs from "fs";
import { Message } from "../contracts/message";
import { LogService as ILogService } from "../contracts/log";
import { formatMessage } from "../message/message";

export class FileLogService implements ILogService {
    private readonly history: Message[] = [];

    constructor(private readonly filePath: string = "./chat.log") {}

    save(message: Message): void {
        this.history.push(message);

        if (this.filePath) {
            try {
                const logLine = formatMessage(message) + "\n";
                fs.appendFileSync(this.filePath, logLine, "utf-8");
            } catch (error) {
                console.error("Failed to write to log file:", error);
            }
        }
    }

    getHistory(): Message[] {
        return [...this.history];
    }
}