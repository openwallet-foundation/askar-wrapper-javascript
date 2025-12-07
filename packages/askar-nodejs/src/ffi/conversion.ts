import { EncryptedBuffer } from '@openwallet-foundation/askar-shared'
import * as koffi from 'koffi'
import type { ByteBufferType, EncryptedBufferType } from './structures'

export const uint8ArrayToByteBufferStruct = (buffer: Uint8Array = new Uint8Array(0)): ByteBufferType => {
  return { data: buffer, len: buffer.length }
}

export const byteBufferToUint8Array = (byteBuffer: ByteBufferType): Uint8Array => {
  // With koffi, pointer data needs to be decoded
  const { data, len } = byteBuffer

  // Check if data is already a Uint8Array
  if (data instanceof Uint8Array) {
    return data.slice(0, len)
  }

  // If data is a koffi external pointer, decode it as uint8 array
  const decoded = koffi.decode(data, 'uint8_t', len)
  return decoded
}

export const secretBufferToUint8Array = byteBufferToUint8Array

export const encryptedBufferStructToClass = ({ secretBuffer, tagPos, noncePos }: EncryptedBufferType) => {
  const buffer = Uint8Array.from(secretBufferToUint8Array(secretBuffer))

  return new EncryptedBuffer({ tagPos, noncePos, buffer })
}
