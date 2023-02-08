import { createSyncronizeTest, mockCRDTMap } from "@organicdesign/crdt-tests";
import { createCRDTMapSynchronizer } from "../src/index.js";

const mockMap = () => mockCRDTMap(createCRDTMapSynchronizer());

createSyncronizeTest(mockMap, (crdt, index) => crdt.action(index));
