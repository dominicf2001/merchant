import { DateTime } from "luxon";

export interface Message {
    id: string;
    type: string;
    timestamp: string;
    timestampEdited: null;
    callEndedTimestamp: null;
    isPinned: boolean;
    content: string;
    author: Author;
    mentions: Author[];
}

export interface Author {
    id: string;
    name: string;
    discriminator: string;
    nickname: string;
    color: string;
    isBot: boolean;
    roles: Role[];
    avatarUrl: string;
}

export interface Role {
    id: string;
    name: string;
    color: string;
    position: number;
}

export interface Guild {
    id: string;
    name: string;
}

export interface SimParams {
    guildID: string;
    start: string;
    end: string;
    clearCache: boolean;
}

export interface SimState {
    start: DateTime,
    end: DateTime,
    nextTick: DateTime,
    progress: number
}
