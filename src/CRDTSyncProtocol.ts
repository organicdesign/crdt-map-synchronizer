/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { enumeration, encodeMessage, decodeMessage, message } from 'protons-runtime'
import type { Codec } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export enum MessageType {
  SELECT = 'SELECT',
  SELECT_RESPONSE = 'SELECT_RESPONSE',
  SYNC = 'SYNC',
  SYNC_RESPONSE = 'SYNC_RESPONSE'
}

enum __MessageTypeValues {
  SELECT = 0,
  SELECT_RESPONSE = 1,
  SYNC = 2,
  SYNC_RESPONSE = 3
}

export namespace MessageType {
  export const codec = (): Codec<MessageType> => {
    return enumeration<MessageType>(__MessageTypeValues)
  }
}
export interface SyncMessage {
  type: MessageType
  sync?: Uint8Array
  crdt?: string
  protocol?: string
  accept?: boolean
}

export namespace SyncMessage {
  let _codec: Codec<SyncMessage>

  export const codec = (): Codec<SyncMessage> => {
    if (_codec == null) {
      _codec = message<SyncMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (opts.writeDefaults === true || (obj.type != null && __MessageTypeValues[obj.type] !== 0)) {
          w.uint32(8)
          MessageType.codec().encode(obj.type ?? MessageType.SELECT, w)
        }

        if (obj.sync != null) {
          w.uint32(18)
          w.bytes(obj.sync)
        }

        if (obj.crdt != null) {
          w.uint32(26)
          w.string(obj.crdt)
        }

        if (obj.protocol != null) {
          w.uint32(34)
          w.string(obj.protocol)
        }

        if (obj.accept != null) {
          w.uint32(40)
          w.bool(obj.accept)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          type: MessageType.SELECT
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.type = MessageType.codec().decode(reader)
              break
            case 2:
              obj.sync = reader.bytes()
              break
            case 3:
              obj.crdt = reader.string()
              break
            case 4:
              obj.protocol = reader.string()
              break
            case 5:
              obj.accept = reader.bool()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<SyncMessage>): Uint8Array => {
    return encodeMessage(obj, SyncMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): SyncMessage => {
    return decodeMessage(buf, SyncMessage.codec())
  }
}
