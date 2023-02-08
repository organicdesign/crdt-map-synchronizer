import {
	CRDT,
	CRDTSynchronizer,
	SyncContext,
	CreateSynchronizer,
	isSynchronizable,
	getSynchronizer,
	getSynchronizerProtocols
} from "@organicdesign/crdt-interfaces";
import { SyncMessage, MessageType } from "./CRDTSyncProtocol.js";

export type CRDTMapSyncComponents = {
	keys (): Iterable<string>
	get (key: string): CRDT | undefined
	getId (): Uint8Array
}

export interface CRDTMapSyncOpts {
	protocol: string
}

export class CRDTMapSynchronizer implements CRDTSynchronizer {
	public readonly protocol: string;
	private readonly components: CRDTMapSyncComponents;

	constructor(components: CRDTMapSyncComponents, options: Partial<CRDTMapSyncOpts> = {}) {
		this.protocol = options.protocol ?? "/stateless-crdt-map/0.1.0";
		this.components = components;
	}

	sync (data: Uint8Array | undefined, context: SyncContext): Uint8Array | undefined {
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

	private handleSelectResponse (message: SyncMessage, context: SyncContext) {
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
		} else {
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

	private handleSyncResponse (message: SyncMessage, context: SyncContext) {
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

	private handleSync (message: SyncMessage, context: SyncContext) {
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

	private handleSelect (message: SyncMessage) {
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

	private acceptProtocol (crdt: string, protocol: string) {
		return SyncMessage.encode({
			type: MessageType.SELECT_RESPONSE,
			accept: true,
			crdt,
			protocol
		});
	}

	private acceptCrdt (crdt: string) {
		return SyncMessage.encode({
			type: MessageType.SELECT_RESPONSE,
			accept: true,
			crdt
		});
	}

	private rejectProtocol (crdt: string, protocol: string) {
		return SyncMessage.encode({
			type: MessageType.SELECT_RESPONSE,
			accept: false,
			crdt,
			protocol
		});
	}

	private rejectCrdt (crdt: string) {
		return SyncMessage.encode({
			type: MessageType.SELECT_RESPONSE,
			accept: false,
			crdt
		});
	}

	// Create a messsage that selects the next protocol.
	private selectNextProtocol (crdt: string, protocol?: string) {
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
	private selectNextCrdt (name?: string) {
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
	private getNextCrdt(last?: string) {
		return this.getNext(this.components.keys(), last);
	}

	// Get the next protocol name.
	private getNextProtocol(crdtName: string, last?: string) {
		const crdt = this.components.get(crdtName);

		if (crdt == null || !isSynchronizable(crdt)) {
			return;
		}

		const iterable = getSynchronizerProtocols(crdt);

		return this.getNext(iterable, last);
	}

	// Get the next value from an iterable.
	private getNext (iterable: Iterable<string>, last?: string): string | undefined {
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

export const createCRDTMapSynchronizer =
	(options?: Partial<CRDTMapSyncOpts>): CreateSynchronizer<CRDTMapSyncComponents, CRDTMapSynchronizer> =>
		(components: CRDTMapSyncComponents) => new CRDTMapSynchronizer(components, options);
