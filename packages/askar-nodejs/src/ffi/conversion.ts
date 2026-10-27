import { EncryptedBuffer } from '@openwallet-foundation/askar-shared'
import * as koffi from 'koffi'
import { FFI_INT32, FFI_INT64, FFI_UINT8, FFI_USIZE } from './primitives'
import {
  ByteBufferStruct,
  type ByteBufferType,
  type EncryptedBufferType,
  FfiHandleListStruct,
  type FfiHandleListType,
} from './structures'

export const uint8ArrayToByteBufferStruct = (buffer: Uint8Array = new Uint8Array(0)): ByteBufferType => {
  return { data: buffer, len: buffer.length }
}

export type NodeJsHandleList = {
  len: number
  data: unknown
}

// koffi.decode(pointer, type, len) leaks about 20 bytes on every call: it formats the name of a new array type each
// time. koffi does decode a pointer member whose length is in another member of the struct without a new type, so the
// struct is copied to a buffer and decoded as a struct with such a member
const decodeCounted = <Type>(struct: koffi.TypeObject, countedStruct: koffi.TypeObject, value: object): Type => {
  const buffer = new Uint8Array(koffi.sizeof(struct))
  koffi.encode(buffer, struct, value)
  return koffi.decode(buffer, countedStruct).data
}

// decodeCounted reads the bytes of a struct as its counted struct, so each counted struct must have the same layout as
// its source struct in structures.ts: the same member types, in the same order
const CountedByteBufferStruct = koffi.struct({ len: FFI_INT64, data: koffi.pointer(null, FFI_UINT8, 'len') })
const CountedHandleListStruct = koffi.struct({ len: FFI_INT32, data: koffi.pointer(null, FFI_USIZE, 'len') })

export const decodeHandleList = (handleList: FfiHandleListType): number[] => {
  if (handleList.len === 0) return []

  // koffi decodes size_t values as BigInts. The handles are sequence numbers, as for the store, session and scan
  // handles that Askar returns directly
  return Array.from(decodeCounted<BigUint64Array>(FfiHandleListStruct, CountedHandleListStruct, handleList), Number)
}

export const byteBufferToUint8Array = (byteBuffer: ByteBufferType): Uint8Array => {
  // With koffi, pointer data needs to be decoded
  const { data, len } = byteBuffer

  // Check if data is already a Uint8Array
  if (data instanceof Uint8Array) {
    return data.slice(0, len)
  }

  if (len === 0) return new Uint8Array(0)

  // If data is a koffi pointer, decode it as uint8 array
  return decodeCounted<Uint8Array>(ByteBufferStruct, CountedByteBufferStruct, byteBuffer)
}

export const secretBufferToUint8Array = byteBufferToUint8Array

export const encryptedBufferStructToClass = ({ secretBuffer, tagPos, noncePos }: EncryptedBufferType) => {
  const buffer = Uint8Array.from(secretBufferToUint8Array(secretBuffer))

  return new EncryptedBuffer({ tagPos, noncePos, buffer })
}
