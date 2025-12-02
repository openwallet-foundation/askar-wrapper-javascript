import * as koffi from 'koffi'
import { FFI_CALLBACK_ID, FFI_ERROR_CODE, FFI_INT32, FFI_STRING, FFI_VOID } from './primitives'

export type NativeCallback = (id: number, errorCode: number) => void

// Define the callback types for koffi once (not per call)
// Use unnamed proto to match any callback pointer type
const NativeCallbackType = koffi.proto(`${FFI_VOID} (${FFI_CALLBACK_ID} id, ${FFI_ERROR_CODE} errorCode)`)

// Map to track registered callbacks
const registeredCallbacks = new Map<number, koffi.IKoffiRegisteredCallback>()
let callbackIdCounter = 0

export const toNativeCallback = (cb: NativeCallback) => {
  const wrappedCallback = (id: number, errorCode: number) => {
    cb(id, errorCode)
  }

  // Register with koffi - must use koffi.pointer() for callback registration
  const registeredCallback = koffi.register(wrappedCallback, koffi.pointer(NativeCallbackType))
  const id = callbackIdCounter++
  registeredCallbacks.set(id, registeredCallback)

  // Return the registered callback pointer directly
  return { nativeCallback: registeredCallback, id }
}

export const deallocateCallback = (id: number) => {
  const callback = registeredCallbacks.get(id)
  if (callback) {
    koffi.unregister(callback)
    registeredCallbacks.delete(id)
  }
}

export type NativeCallbackWithResponse<R> = (id: number, errorCode: number, response: R) => void

// Cache for callback types by response type
const callbackTypesCache = new Map<string, koffi.IKoffiCType>()

export const toNativeCallbackWithResponse = <R>(cb: NativeCallbackWithResponse<R>, responseFfiType = FFI_STRING) => {
  const wrappedCallback = (id: number, errorCode: number, response: R) => {
    cb(id, errorCode, response)
  }

  // Get or create callback type for this response type
  let callbackType = callbackTypesCache.get(responseFfiType)
  if (!callbackType) {
    // Create a simple proto signature
    callbackType = koffi.proto(`${FFI_VOID} (${FFI_CALLBACK_ID}, ${FFI_ERROR_CODE}, ${responseFfiType})`)
    callbackTypesCache.set(responseFfiType, callbackType)
  }

  const registeredCallback = koffi.register(wrappedCallback, koffi.pointer(callbackType))
  const id = callbackIdCounter++
  registeredCallbacks.set(id, registeredCallback)

  // Return the registered callback pointer directly
  return { nativeCallback: registeredCallback, id }
}

export type NativeLogCallback = (
  context: unknown,
  level: number,
  target: string,
  message: string,
  modulePath: string,
  file: string,
  line: number
) => void

// Define log callback type once (unnamed proto)
const NativeLogCallbackType = koffi.proto(
  `${FFI_VOID} (void *context, ${FFI_INT32} level, ${FFI_STRING} target, ${FFI_STRING} message, ${FFI_STRING} modulePath, ${FFI_STRING} file, ${FFI_INT32} line)`
)

export const toNativeLogCallback = (cb: NativeLogCallback) => {
  const wrappedCallback = (
    context: unknown,
    level: number,
    target: string,
    message: string,
    modulePath: string,
    file: string,
    line: number
  ) => {
    cb(context, level, target, message, modulePath, file, line)
  }

  const registeredCallback = koffi.register(wrappedCallback, koffi.pointer(NativeLogCallbackType))
  const id = callbackIdCounter++
  registeredCallbacks.set(id, registeredCallback)

  // Return the registered callback pointer directly
  return { nativeCallback: registeredCallback, id }
}
