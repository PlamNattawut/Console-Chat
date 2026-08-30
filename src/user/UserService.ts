import { User } from "../contracts/user";
import { validateUsername } from "../validation/validation";

export class UserService {
    private readonly users = new Map<string, User>();

    createUser(username: string): User {
        const user: User = {
            id: crypto.randomUUID(),
            username
        };

        this.users.set(user.id, user);

        return user;
    }

    getUser(id: string): User | undefined {
        return this.users.get(id);
    }

    getUserByUsername(username: string | null | undefined): User | undefined {
        if (!username || typeof username !== "string") {
            return undefined;
        }
        const normalized = username.trim().toLowerCase();
        for (const user of this.users.values()) {
            if (user.username.trim().toLowerCase() === normalized) {
                return user;
            }
        }
        return undefined;
    }

    isUsernameTaken(username: string | null | undefined): boolean {
        if (!username || typeof username !== "string") {
            return false;
        }
        return this.getUserByUsername(username) !== undefined;
    }

    removeUser(id: string): boolean {
        return this.users.delete(id);
    }

    getAllUsers(): User[] {
        return [...this.users.values()];
    }
}

export const isValidUsername = (
    username: unknown
): boolean =>
    validateUsername(username) === null;