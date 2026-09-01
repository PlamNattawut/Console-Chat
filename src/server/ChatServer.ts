import { WebSocketServer, WebSocket } from "ws";
import { Message, ClientAction, ServerEvent } from "../contracts/message";
import { UserService } from "../user/UserService";
import { validateUsername, validateMessage } from "../validation/validation";
import { createMessage } from "../message/message";

export class ChatServer {
    private readonly wss: WebSocketServer;
    private readonly userService = new UserService();
    private readonly socketUserMap = new Map<WebSocket, string>(); // socket -> userId
    private readonly aliveSockets = new WeakSet<WebSocket>();
    private pingInterval?: NodeJS.Timeout;

    constructor(private readonly port: number) {
        this.wss = new WebSocketServer({
            port: this.port
        });
    }

    start(): void {
        this.wss.on("connection", (socket: WebSocket) => {
            console.log("Client connected");
            this.aliveSockets.add(socket);

            socket.on("pong", () => {
                this.aliveSockets.add(socket);
            });

            socket.on("message", (data) => {
                try {
                    const action = JSON.parse(data.toString()) as ClientAction;
                    this.handleAction(socket, action);
                } catch (error) {
                    console.error("Invalid message received:", error);
                }
            });

            socket.on("close", () => {
                const userId = this.socketUserMap.get(socket);
                if (userId) {
                    const user = this.userService.getUser(userId);
                    this.userService.removeUser(userId);
                    this.socketUserMap.delete(socket);

                    if (user) {
                        console.log(`User '${user.username}' disconnected`);
                        this.broadcast({
                            type: "SYSTEM",
                            content: `🔴 User '${user.username}' left the chat.`
                        });
                    }
                } else {
                    console.log("Unregistered client disconnected");
                }
            });
        });

        this.pingInterval = setInterval(() => {
            this.wss.clients.forEach((socket) => {
                if (!this.aliveSockets.has(socket)) {
                    console.log("Terminating unresponsive client");
                    return socket.terminate();
                }
                this.aliveSockets.delete(socket);
                socket.ping();
            });
        }, 10000); // Check every 10 seconds

        this.wss.on("close", () => {
            clearInterval(this.pingInterval);
        });

        console.log(`WebSocket server running on port ${this.port}`);
    }

    private handleAction(socket: WebSocket, action: ClientAction): void {
        switch (action.type) {
            case "JOIN": {
                const validationError = validateUsername(action.username);
                if (validationError) {
                    this.sendTo(socket, {
                        type: "JOIN_RESPONSE",
                        success: false,
                        error: validationError
                    });
                    return;
                }

                const username = action.username!.trim();
                if (this.userService.isUsernameTaken(username)) {
                    this.sendTo(socket, {
                        type: "JOIN_RESPONSE",
                        success: false,
                        error: `Username '${username}' is already taken. Please choose another.`
                    });
                    return;
                }

                const user = this.userService.createUser(username);
                this.socketUserMap.set(socket, user.id);

                this.sendTo(socket, {
                    type: "JOIN_RESPONSE",
                    success: true,
                    user: { id: user.id, username: user.username }
                });

                this.broadcast({
                    type: "SYSTEM",
                    content: `🟢 User '${user.username}' joined the chat.`
                });
                break;
            }

            case "MESSAGE": {
                const userId = this.socketUserMap.get(socket);
                if (!userId) {
                    this.sendTo(socket, {
                        type: "SYSTEM",
                        content: "⚠️ You must set a username before sending messages."
                    });
                    return;
                }

                const user = this.userService.getUser(userId);
                if (!user) return;

                const error = validateMessage(action.content);
                if (error) {
                    this.sendTo(socket, {
                        type: "SYSTEM",
                        content: `⚠️ ${error}`
                    });
                    return;
                }

                const message = createMessage(user.username, action.content!);
                this.broadcast({
                    type: "MESSAGE",
                    message
                });
                break;
            }

            case "GET_USERS": {
                const users = this.userService.getAllUsers().map(u => u.username);
                this.sendTo(socket, {
                    type: "USERS_LIST",
                    users
                });
                break;
            }
        }
    }

    private sendTo(socket: WebSocket, event: ServerEvent): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(event));
        }
    }

    private broadcast(event: ServerEvent): void {
        const data = JSON.stringify(event);
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
}