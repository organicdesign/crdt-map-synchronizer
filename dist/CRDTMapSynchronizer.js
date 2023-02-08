import { isSynchronizable, getSynchronizer, getSynchronizerProtocols } from "@organicdesign/crdt-interfaces";
import { SyncMessage, MessageType } from "./CRDTSyncProtocol.js";
export class CRDTMapSynchronizer {
    constructor(components, options = {}) {
        var _a;
        this.protocol = (_a = options.protocol) !== null && _a !== void 0 ? _a : "/stateless-crdt-map/0.1.0";
        this.components = components;
    }
    sync(data, context) {
        if (data == null) {
            const crdt = this.getNextCrdt();
            return SyncMessage.encode({
                type: MessageType.SELECT,
                crdt
            });
        }
        const message = SyncMessage.decode(data);
        switch (message.type) {
            case MessageType.SELECT_RESPONSE:
                return this.handleSelectResponse(message, context);
            case MessageType.SYNC_RESPONSE:
                return this.handleSyncResponse(message, context);
            case MessageType.SYNC:
                return this.handleSync(message, context);
            case MessageType.SELECT:
                return this.handleSelect(message);
            default:
                throw new Error(`recieved unknown message type: ${message.type}`);
        }
    }
    handleSelectResponse(message, context) {
        if (message.accept) {
            if (message.crdt != null && message.protocol != null) {
                // Accepted both protocol and crdt
                const crdt = this.components.get(message.crdt);
                if (crdt == null || !isSynchronizable(crdt)) {
                    return this.selectNextCrdt(message.crdt);
                }
                const synchronizer = getSynchronizer(crdt, message.protocol);
                if (synchronizer == null) {
                    return this.selectNextProtocol(message.crdt, message.protocol);
                }
                return SyncMessage.encode({
                    type: MessageType.SYNC,
                    sync: synchronizer.sync(undefined, context),
                    crdt: message.crdt,
                    protocol: message.protocol
                });
            }
            if (message.crdt != null) {
                return this.selectNextProtocol(message.crdt, message.protocol);
            }
        }
        else {
            if (message.crdt != null && message.protocol != null) {
                return this.selectNextProtocol(message.crdt, message.protocol);
            }
            if (message.crdt != null) {
                // Rejected only CRDT
                return this.selectNextCrdt(message.crdt);
            }
        }
        throw new Error("SELECT_RESPONSE must include crdt");
    }
    handleSyncResponse(message, context) {
        if (message.protocol == null || message.crdt == null) {
            throw new Error("missing protocol or crdt");
        }
        if (message.sync == null || message.sync.length === 0) {
            return this.selectNextCrdt(message.crdt);
        }
        const crdt = this.components.get(message.crdt);
        if (crdt == null || !isSynchronizable(crdt)) {
            return this.rejectCrdt(message.crdt);
        }
        const synchronizer = getSynchronizer(crdt, message.protocol);
        if (synchronizer == null) {
            return this.rejectProtocol(message.crdt, message.protocol);
        }
        return SyncMessage.encode({
            type: MessageType.SYNC,
            sync: synchronizer.sync(message.sync, context),
            crdt: message.crdt,
            protocol: message.protocol
        });
    }
    handleSync(message, context) {
        if (message.protocol == null || message.crdt == null) {
            throw new Error("missing protocol or crdt");
        }
        const crdt = this.components.get(message.crdt);
        if (crdt == null || !isSynchronizable(crdt)) {
            return this.rejectCrdt(message.crdt);
        }
        const synchronizer = getSynchronizer(crdt, message.protocol);
        if (synchronizer == null) {
            return this.rejectProtocol(message.crdt, message.protocol);
        }
        return SyncMessage.encode({
            type: MessageType.SYNC_RESPONSE,
            sync: synchronizer.sync(message.sync, context),
            crdt: message.crdt,
            protocol: message.protocol
        });
    }
    handleSelect(message) {
        if (message.crdt != null && message.protocol != null) {
            // Trying to select protocol
            const crdt = this.components.get(message.crdt);
            if (crdt == null || !isSynchronizable(crdt)) {
                return this.rejectCrdt(message.crdt);
            }
            const synchronizer = getSynchronizer(crdt, message.protocol);
            if (synchronizer == null) {
                return this.rejectProtocol(message.crdt, message.protocol);
            }
            return this.acceptProtocol(message.crdt, message.protocol);
        }
        if (message.crdt != null) {
            // Trying to select CRDT
            if (this.components.get(message.crdt) == null) {
                return this.rejectCrdt(message.crdt);
            }
            return this.acceptCrdt(message.crdt);
        }
        throw new Error("SELECT must include crdt");
    }
    acceptProtocol(crdt, protocol) {
        return SyncMessage.encode({
            type: MessageType.SELECT_RESPONSE,
            accept: true,
            crdt,
            protocol
        });
    }
    acceptCrdt(crdt) {
        return SyncMessage.encode({
            type: MessageType.SELECT_RESPONSE,
            accept: true,
            crdt
        });
    }
    rejectProtocol(crdt, protocol) {
        return SyncMessage.encode({
            type: MessageType.SELECT_RESPONSE,
            accept: false,
            crdt,
            protocol
        });
    }
    rejectCrdt(crdt) {
        return SyncMessage.encode({
            type: MessageType.SELECT_RESPONSE,
            accept: false,
            crdt
        });
    }
    // Create a messsage that selects the next protocol.
    selectNextProtocol(crdt, protocol) {
        const next = this.getNextProtocol(crdt, protocol);
        if (next == null) {
            return this.selectNextCrdt(crdt);
        }
        return SyncMessage.encode({
            type: MessageType.SELECT,
            crdt,
            protocol: next
        });
    }
    // Create a message that selects the next CRDT.
    selectNextCrdt(name) {
        const crdt = this.getNextCrdt(name);
        if (crdt == null) {
            return;
        }
        return SyncMessage.encode({
            type: MessageType.SELECT,
            crdt
        });
    }
    // Get the next CRDT name.
    getNextCrdt(last) {
        return this.getNext(this.components.keys(), last);
    }
    // Get the next protocol name.
    getNextProtocol(crdtName, last) {
        const crdt = this.components.get(crdtName);
        if (crdt == null || !isSynchronizable(crdt)) {
            return;
        }
        const iterable = getSynchronizerProtocols(crdt);
        return this.getNext(iterable, last);
    }
    // Get the next value from an iterable.
    getNext(iterable, last) {
        const iterator = iterable[Symbol.iterator]();
        let curr = iterator.next();
        if (curr.done) {
            return;
        }
        if (last == null) {
            return curr.value;
        }
        while (!curr.done) {
            if (curr.value === last) {
                return iterator.next().value;
            }
            curr = iterator.next();
        }
        return curr.value;
    }
}
export const createCRDTMapSynchronizer = (options) => (components) => new CRDTMapSynchronizer(components, options);
