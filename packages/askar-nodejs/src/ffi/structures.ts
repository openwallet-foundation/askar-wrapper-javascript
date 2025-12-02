import * as koffi from 'koffi'
import { FFI_INT32, FFI_INT64, FFI_UINT8 } from './primitives'

// ByteBuffer structure
export const ByteBufferStruct = koffi.struct('ByteBuffer', {
  len: FFI_INT64,
  data: koffi.pointer(FFI_UINT8),
})

export type ByteBufferType = {
  len: number
  data: Uint8Array
}

// SecretBuffer is same as ByteBuffer
export const SecretBufferStruct = ByteBufferStruct
export type SecretBufferType = ByteBufferType

// EncryptedBuffer structure
export const EncryptedBufferStruct = koffi.struct('EncryptedBuffer', {
  secretBuffer: ByteBufferStruct,
  tagPos: FFI_INT64,
  noncePos: FFI_INT64,
})

export type EncryptedBufferType = {
  secretBuffer: SecretBufferType
  tagPos: number
  noncePos: number
}

// AeadParams structure
export const AeadParamsStruct = koffi.struct('AeadParams', {
  nonceLength: FFI_INT32,
  tagLength: FFI_INT32,
})
