import WebSocket from "ws";
import { ClientAction, ServerEvent } from "../contracts/message";

export class ChatClient {
    private socket?: WebSocket;

    constructor(private readonly url: string) {}

    connect(
        onEvent: (event: ServerEvent) => void,
        onOpen?: () => void,
        onError?: (error: Error) => void
    ): void {
        this.socket = new WebSocket(this.url);

        this.socket.on("open", () => {
            onOpen?.();
        });

        this.socket.on("message", (data) => {
            try {
                const event = JSON.parse(data.toString()) as ServerEvent;
                onEvent(event);
            } catch (error) {
                console.error("Failed to parse server event:", error);
            }
        });

        this.socket.on("close", () => {
            onEvent({
                type: "SYSTEM",
                content: "🔌 Disconnected from server."
            });
        });

        this.socket.on("error", (error) => {
            onError?.(error);
        });
    }

    sendAction(action: ClientAction): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(action));
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}