import * as koffi from 'koffi'

export const FFI_UINT8 = koffi.types.uint8_t
export const FFI_UINT64 = koffi.types.uint64_t
export const FFI_USIZE = koffi.types.size_t
export const FFI_INT8 = koffi.types.int8_t
export const FFI_INT32 = koffi.types.int32_t
export const FFI_INT64 = koffi.types.int64_t
export const FFI_STRING = koffi.types.string
export const FFI_VOID = koffi.types.void

export const FFI_CALLBACK_ID = FFI_INT64
export const FFI_ERROR_CODE = FFI_INT64

export const FFI_ARC_HANDLE = koffi.pointer(FFI_VOID)
export const FFI_ENTRY_LIST_HANDLE = FFI_ARC_HANDLE
export const FFI_KEY_ENTRY_LIST_HANDLE = FFI_ARC_HANDLE
export const FFI_LOCAL_KEY_HANDLE = FFI_ARC_HANDLE
export const FFI_STRING_LIST_HANDLE = FFI_ARC_HANDLE
export const FFI_SESSION_HANDLE = FFI_USIZE
export const FFI_SCAN_HANDLE = FFI_USIZE
export const FFI_STORE_HANDLE = FFI_USIZE
