/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { enumeration, encodeMessage, decodeMessage, message } from 'protons-runtime';
export var MessageType;
(function (MessageType) {
    MessageType["SELECT"] = "SELECT";
    MessageType["SELECT_RESPONSE"] = "SELECT_RESPONSE";
    MessageType["SYNC"] = "SYNC";
    MessageType["SYNC_RESPONSE"] = "SYNC_RESPONSE";
})(MessageType || (MessageType = {}));
var __MessageTypeValues;
(function (__MessageTypeValues) {
    __MessageTypeValues[__MessageTypeValues["SELECT"] = 0] = "SELECT";
    __MessageTypeValues[__MessageTypeValues["SELECT_RESPONSE"] = 1] = "SELECT_RESPONSE";
    __MessageTypeValues[__MessageTypeValues["SYNC"] = 2] = "SYNC";
    __MessageTypeValues[__MessageTypeValues["SYNC_RESPONSE"] = 3] = "SYNC_RESPONSE";
})(__MessageTypeValues || (__MessageTypeValues = {}));
(function (MessageType) {
    MessageType.codec = () => {
        return enumeration(__MessageTypeValues);
    };
})(MessageType || (MessageType = {}));
export var SyncMessage;
(function (SyncMessage) {
    let _codec;
    SyncMessage.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                var _a;
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (opts.writeDefaults === true || (obj.type != null && __MessageTypeValues[obj.type] !== 0)) {
                    w.uint32(8);
                    MessageType.codec().encode((_a = obj.type) !== null && _a !== void 0 ? _a : MessageType.SELECT, w);
                }
                if (obj.sync != null) {
                    w.uint32(18);
                    w.bytes(obj.sync);
                }
                if (obj.crdt != null) {
                    w.uint32(26);
                    w.string(obj.crdt);
                }
                if (obj.protocol != null) {
                    w.uint32(34);
                    w.string(obj.protocol);
                }
                if (obj.accept != null) {
                    w.uint32(40);
                    w.bool(obj.accept);
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length) => {
                const obj = {
                    type: MessageType.SELECT
                };
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            obj.type = MessageType.codec().decode(reader);
                            break;
                        case 2:
                            obj.sync = reader.bytes();
                            break;
                        case 3:
                            obj.crdt = reader.string();
                            break;
                        case 4:
                            obj.protocol = reader.string();
                            break;
                        case 5:
                            obj.accept = reader.bool();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    SyncMessage.encode = (obj) => {
        return encodeMessage(obj, SyncMessage.codec());
    };
    SyncMessage.decode = (buf) => {
        return decodeMessage(buf, SyncMessage.codec());
    };
})(SyncMessage || (SyncMessage = {}));
