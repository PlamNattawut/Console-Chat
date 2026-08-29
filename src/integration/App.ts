import { ChatClient } from "../client/ChatClient";
import { TerminalUI } from "../ui/TerminalUI";
import { FileLogService } from "../log/LogService";
import { formatMessage } from "../message/message";
import { validateUsername, validateMessage } from "../validation/validation";
import { parseCommand } from "../command/command";
import { ServerEvent } from "../contracts/message";

export class App {
    private readonly client: ChatClient;
    private readonly logService: FileLogService;
    private ui?: TerminalUI;

    private state: "AWAITING_USERNAME" | "CHATTING" = "AWAITING_USERNAME";
    private currentUser?: { id: string; username: string };

    constructor() {
        this.client = new ChatClient("ws://localhost:8080");
        this.logService = new FileLogService("./chat.log");
    }

    async start(): Promise<void> {
        this.ui = await TerminalUI.create();

        this.ui.addMessage("╔══════════════════════════════════════════════════════════════╗");
        this.ui.addMessage("║                💬 Welcome to Terminal Chat!                  ║");
        this.ui.addMessage("║   Please enter your desired username below to join the chat. ║");
        this.ui.addMessage("╚══════════════════════════════════════════════════════════════╝\n");

        this.client.connect(
            (event: ServerEvent) => {
                this.handleServerEvent(event);
            },
            () => {
                this.ui?.addMessage("⚡ Connected to WebSocket server.");
            },
            (error: Error) => {
                this.ui?.addMessage(`⚠️ Connection error: ${error.message}`);
            }
        );

        this.ui.onSubmit((input) => {
            if (!input) return;

            if (this.state === "AWAITING_USERNAME") {
                this.handleUsernameSubmit(input);
            } else {
                this.handleChatSubmit(input);
            }
        });
    }

    private handleUsernameSubmit(input: string): void {
        const error = validateUsername(input);
        if (error) {
            this.ui?.addMessage(`⚠️ ${error}`);
            return;
        }

        this.ui?.addMessage(`⏳ Checking availability for "${input}"...`);
        this.client.sendAction({
            type: "JOIN",
            username: input
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