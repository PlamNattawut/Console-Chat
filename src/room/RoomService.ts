import { Room } from "../contracts/room";

export class RoomService {
    private readonly rooms = new Map<string, Room>();

    createRoom(name: string): Room {
        const room: Room = {
            id: crypto.randomUUID(),
            name,
            users: []
        };

        this.rooms.set(room.id, room);

        return room;
    }

    joinRoom(
        roomId: string,
        userId: string
    ): boolean {

        const room = this.rooms.get(roomId);

        if (!room) {
            return false;
        }

        if (!room.users.includes(userId)) {
            room.users.push(userId);
        }

        return true;
    }

    leaveRoom(
        roomId: string,
        userId: string
    ): boolean {

        const room = this.rooms.get(roomId);

        if (!room) {
            return false;
        }

        room.users = room.users.filter(
            id => id !== userId
        );

        return true;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }
}