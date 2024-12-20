import { alloc } from '@2060.io/ref-napi'
import { FFI_INT8, FFI_INT32, FFI_POINTER, FFI_STRING } from './primitives'
import { AeadParamsStruct, EncryptedBufferStruct, SecretBufferStruct } from './structures'

export const allocatePointer = (): Buffer => alloc(FFI_POINTER)

export const allocateStringBuffer = (): Buffer => alloc(FFI_STRING)

export const allocateInt32Buffer = (): Buffer => alloc(FFI_INT32)

export const allocateInt8Buffer = (): Buffer => alloc(FFI_INT8)

export const allocateSecretBuffer = (): Buffer => alloc(SecretBufferStruct)

export const allocateEncryptedBuffer = (): Buffer => alloc(EncryptedBufferStruct)

export const allocateAeadParams = (): Buffer => alloc(AeadParamsStruct)

export const allocateLocalKeyHandle = allocatePointer

export const allocateStringListHandle = allocatePointer

export const allocateCallbackBuffer = (callback: Buffer) => setTimeout(() => callback, 1000000)

export const deallocateCallbackBuffer = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout)
