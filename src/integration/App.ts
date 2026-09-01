import { ChatClient } from "../client/ChatClient";
import { TerminalUI } from "../ui/TerminalUI";
import { FileLogService } from "../log/LogService";
import { formatMessage } from "../message/message";
import { validateUsername, validateMessage } from "../validation/validation";
import { parseCommand } from "../command/command";
import { ServerEvent } from "../contracts/message";

export class App {
    private client!: ChatClient;
    private readonly logService: FileLogService;
    private ui?: TerminalUI;

    private state: "AWAITING_SERVER_IP" | "AWAITING_USERNAME" | "CHATTING" = "AWAITING_SERVER_IP";
    private currentUser?: { id: string; username: string };

    constructor() {
        this.logService = new FileLogService("./chat.log");
    }

    async start(): Promise<void> {
        this.ui = await TerminalUI.create();

        this.ui.addMessage("╔══════════════════════════════════════════════════════════════╗");
        this.ui.addMessage("║                💬 Welcome to Terminal Chat!                  ║");
        this.ui.addMessage("║   Please enter the Server IP (leave empty for localhost).    ║");
        this.ui.addMessage("╚══════════════════════════════════════════════════════════════╝\n");
        this.ui.setPlaceholder("Server IP (e.g. 192.168.1.45)...");

        this.ui.onSubmit((input) => {
            if (this.state === "AWAITING_SERVER_IP") {
                this.handleServerIpSubmit(input);
            } else if (this.state === "AWAITING_USERNAME") {
                this.handleUsernameSubmit(input);
            } else {
                if (!input) return;
                this.handleChatSubmit(input);
            }
        });
    }

    private formatServerUrl(input: string): string {
        if (input.startsWith("ws://") || input.startsWith("wss://")) return input;
        
        let address = input.replace(/^(https?:\/\/|tcp:\/\/)/, "");
        
        if (address.includes("ngrok-free.app") || address.includes("ngrok.io")) {
            return `wss://${address}`;
        }
        
        return address.includes(":") ? `ws://${address}` : `ws://${address}:8080`;
    }

    private handleServerIpSubmit(input: unknown): void {
        const rawInput = typeof input === "string" && input.trim() !== "" ? input.trim() : "localhost";
        const url = this.formatServerUrl(rawInput);

        this.client = new ChatClient(url);

        this.ui?.addMessage(`⏳ Connecting to ${url}...`);

        this.client.connect(
            (event: ServerEvent) => {
                this.handleServerEvent(event);
            },
            () => {
                this.ui?.addMessage("⚡ Connected to WebSocket server.");
                this.state = "AWAITING_USERNAME";
                this.ui?.setPlaceholder("Type your username...");
                this.ui?.addMessage("\n👉 Please enter your desired username below to join the chat:");
            },
            (error: Error) => {
                this.ui?.addMessage(`⚠️ Connection error: ${error.message}`);
                this.ui?.addMessage("👉 Please enter the Server IP again (leave empty for localhost):");
            }
        );
    }

    private handleUsernameSubmit(input: unknown): void {
        const error = validateUsername(input);
        if (error) {
            this.ui?.addMessage(`⚠️ ${error}`);
            this.ui?.addMessage("👉 Please enter a valid username to continue:");
            return;
        }

        const username = typeof input === "string" ? input.trim() : "";
        this.ui?.addMessage(`⏳ Checking availability for "${username}"...`);
        this.client.sendAction({
            type: "JOIN",
            username: username
        });
    }

    private handleChatSubmit(input: string): void {
        const command = parseCommand(input);

        switch (command.type) {
            case "HELP":
                this.ui?.addMessage(
                    "\n📖 Available Commands:\n" +
                    "  /help  - Show command list\n" +
                    "  /users - View online users\n" +
                    "  /clear - Clear screen\n" +
                    "  /quit  - Exit chat\n"
                );
                break;

            case "USERS":
                this.client.sendAction({
                    type: "GET_USERS"
                });
                break;

            case "CLEAR":
                this.ui?.clear();
                break;

            case "QUIT":
                this.client.disconnect();
                this.ui?.destroy();
                process.exit(0);

            case "MESSAGE": {
                const error = validateMessage(command.content);
                if (error) {
                    this.ui?.addMessage(`⚠️ ${error}`);
                    return;
                }

                this.client.sendAction({
                    type: "MESSAGE",
                    content: command.content
                });
                break;
            }
        }
    }

    private handleServerEvent(event: ServerEvent): void {
        switch (event.type) {
            case "JOIN_RESPONSE":
                if (!event.success) {
                    this.ui?.addMessage(`❌ ${event.error ?? "Failed to join"}`);
                    this.ui?.addMessage("👉 Please enter a different username:");
                } else if (event.user) {
                    this.currentUser = event.user;
                    this.state = "CHATTING";
                    this.ui?.setPlaceholder("Type a message or /help...");
                    this.ui?.setInputTitle(` Message (${this.currentUser.username}) `);
                    this.ui?.addMessage(`\n✨ Joined as "${this.currentUser.username}"! Type /help for commands.\n`);
                }
                break;

            case "MESSAGE":
                this.logService.save(event.message);
                this.ui?.addMessage(formatMessage(event.message));
                break;

            case "SYSTEM":
                this.ui?.addMessage(event.content);
                break;

            case "USERS_LIST":
                this.ui?.addMessage(`👥 Online users (${event.users.length}): ${event.users.join(", ")}`);
                break;
        }
    }
}
