import { CRDT, CRDTSynchronizer, SyncContext, CreateSynchronizer } from "@organicdesign/crdt-interfaces";
export type CRDTMapSyncComponents = {
    keys(): Iterable<string>;
    get(key: string): CRDT | undefined;
    getId(): Uint8Array;
};
export interface CRDTMapSyncOpts {
    protocol: string;
}
export declare class CRDTMapSynchronizer implements CRDTSynchronizer {
    readonly protocol: string;
    private readonly components;
    constructor(components: CRDTMapSyncComponents, options?: Partial<CRDTMapSyncOpts>);
    sync(data: Uint8Array | undefined, context: SyncContext): Uint8Array | undefined;
    private handleSelectResponse;
    private handleSyncResponse;
    private handleSync;
    private handleSelect;
    private acceptProtocol;
    private acceptCrdt;
    private rejectProtocol;
    private rejectCrdt;
    private selectNextProtocol;
    private selectNextCrdt;
    private getNextCrdt;
    private getNextProtocol;
    private getNext;
}
export declare const createCRDTMapSynchronizer: (options?: Partial<CRDTMapSyncOpts>) => CreateSynchronizer<CRDTMapSyncComponents, CRDTMapSynchronizer>;
