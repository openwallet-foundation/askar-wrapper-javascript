import type { TypedArray } from '@napi-ffi/ref-array-di'
import type { Pointer } from '@napi-ffi/ref-napi'
import { reinterpret } from '@napi-ffi/ref-napi'
import { EncryptedBuffer } from '@openwallet-foundation/askar-shared'
import type { ByteBufferType, EncryptedBufferType } from './structures'
import { ByteBufferStruct } from './structures'

export const byteBufferClassToStruct = ({ len, data }: ByteBufferType) => {
  return ByteBufferStruct({
    len,
    data: data as Pointer<TypedArray<number, number>>,
  })
}

export const secretBufferClassToStruct = byteBufferClassToStruct

export const uint8arrayToByteBufferStruct = (buf: Buffer) => {
  return byteBufferClassToStruct({ data: buf, len: buf.length })
}

export const byteBufferToBuffer = ({ data, len }: ByteBufferType) => reinterpret(data, len)

export const secretBufferToBuffer = byteBufferToBuffer

export const encryptedBufferStructToClass = ({ secretBuffer, tagPos, noncePos }: EncryptedBufferType) => {
  const buffer = Uint8Array.from(secretBufferToBuffer(secretBuffer))

  return new EncryptedBuffer({ tagPos, noncePos, buffer })
}
