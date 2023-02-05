import { createSyncTest, mockCRDTMap } from "../../crdt-tests/src/index.js";
import { createCRDTMapSynchronizer } from "../src/index.js";

const mockMap = () => mockCRDTMap(createCRDTMapSynchronizer());

createSyncTest(mockMap, (crdt, index) => crdt.action(index));
