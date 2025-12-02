import { deallocateCallback } from './callback'

export const allocatePointer = () => {
  // For output parameters with pointers, use array syntax with undefined
  // koffi will handle the pointer allocation automatically
  // biome-ignore lint/suspicious/noExplicitAny: koffi output parameters require any
  return [undefined] as unknown as [any]
}

export const allocateStringBuffer = () => {
  // Allocate space for a string pointer (char **)
  return [null] as unknown as [string | null]
}

export const allocateInt32Buffer = () => {
  // For output parameters, use array syntax
  return [0] as unknown as [number]
}

export const allocateInt8Buffer = () => {
  return [0] as unknown as [number]
}

export const allocateSecretBuffer = () => {
  // For struct output parameters, use array with empty object
  // biome-ignore lint/suspicious/noExplicitAny: koffi output parameters require any
  return [{}] as unknown as [any]
}

export const allocateEncryptedBuffer = () => {
  // biome-ignore lint/suspicious/noExplicitAny: koffi output parameters require any
  return [{}] as unknown as [any]
}

export const allocateAeadParams = () => {
  // biome-ignore lint/suspicious/noExplicitAny: koffi output parameters require any
  return [{}] as unknown as [any]
}

export const allocateLocalKeyHandle = allocatePointer

export const allocateStringListHandle = allocatePointer

// Callback deallocation is now handled in callback.ts
export const deallocateCallbackBuffer = deallocateCallback
