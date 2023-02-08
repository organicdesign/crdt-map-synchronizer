import type { Codec } from 'protons-runtime';
import type { Uint8ArrayList } from 'uint8arraylist';
export declare enum MessageType {
    SELECT = "SELECT",
    SELECT_RESPONSE = "SELECT_RESPONSE",
    SYNC = "SYNC",
    SYNC_RESPONSE = "SYNC_RESPONSE"
}
export declare namespace MessageType {
    const codec: () => Codec<MessageType>;
}
export interface SyncMessage {
    type: MessageType;
    sync?: Uint8Array;
    crdt?: string;
    protocol?: string;
    accept?: boolean;
}
export declare namespace SyncMessage {
    const codec: () => Codec<SyncMessage>;
    const encode: (obj: Partial<SyncMessage>) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList) => SyncMessage;
}
