import { User } from "../contracts/user";
import { validateUsername } from "../validation/validation";

export class UserService {
    private readonly users = new Map<string, User>();
    private readonly usernameToId = new Map<string, string>();

    createUser(username: string): User {
        const trimmed = (username ?? "").trim();
        const existing = this.getUserByUsername(trimmed);
        if (existing) {
            return { ...existing };
        }

        const user: User = {
            id: crypto.randomUUID(),
            username: trimmed
        };

        this.users.set(user.id, user);
        this.usernameToId.set(trimmed.toLowerCase(), user.id);

        return { ...user };
    }

    getUser(id: string): User | undefined {
        if (!id || typeof id !== "string") return undefined;
        const user = this.users.get(id);
        return user ? { ...user } : undefined;
    }

    getUserByUsername(username: string | null | undefined): User | undefined {
        if (!username || typeof username !== "string" || !username.trim()) {
            return undefined;
        }
        const id = this.usernameToId.get(username.trim().toLowerCase());
        if (!id) return undefined;
        return this.getUser(id);
    }

    isUsernameTaken(username: string | null | undefined): boolean {
        if (!username || typeof username !== "string" || !username.trim()) {
            return false;
        }
        return this.usernameToId.has(username.trim().toLowerCase());
    }

    removeUser(id: string): boolean {
        if (!id || typeof id !== "string") return false;
        const user = this.users.get(id);
        if (!user) return false;
        this.users.delete(id);
        this.usernameToId.delete(user.username.toLowerCase());
        return true;
    }

    getAllUsers(): User[] {
        return Array.from(this.users.values()).map(user => ({ ...user }));
    }
}

export const isValidUsername = (
    username: unknown
): boolean =>
    validateUsername(username) === null;