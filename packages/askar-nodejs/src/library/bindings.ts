import * as koffi from 'koffi'
import {
  AeadParamsStruct,
  Argon2ConfigStruct,
  ByteBufferStruct,
  EncryptedBufferStruct,
  FFI_CALLBACK_ENTRY_LIST_HANDLE,
  FFI_CALLBACK_HANDLE_LIST,
  FFI_CALLBACK_ID,
  FFI_CALLBACK_INT8,
  FFI_CALLBACK_INT64,
  FFI_CALLBACK_KEY_ENTRY_LIST_HANDLE,
  FFI_CALLBACK_LOG,
  FFI_CALLBACK_NO_RESULT,
  FFI_CALLBACK_SCAN_HANDLE,
  FFI_CALLBACK_SESSION_HANDLE,
  FFI_CALLBACK_STORE_HANDLE,
  FFI_CALLBACK_STRING,
  FFI_CALLBACK_STRING_LIST_HANDLE,
  FFI_ENTRY_LIST_HANDLE,
  FFI_ERROR_CODE,
  FFI_INT8,
  FFI_INT32,
  FFI_INT64,
  FFI_KEY_ENTRY_LIST_HANDLE,
  FFI_LOCAL_KEY_HANDLE,
  FFI_SCAN_HANDLE,
  FFI_SESSION_HANDLE,
  FFI_STORE_HANDLE,
  FFI_STRING,
  FFI_STRING_LIST_HANDLE,
  FFI_VOID,
  FfiHandleListStruct,
  SecretBufferStruct,
} from '../ffi'

export const nativeBindings: Record<string, [koffi.TypeSpec, Array<koffi.TypeSpec>]> = {
  // Version and termination
  askar_terminate: [FFI_VOID, []],
  askar_version: [koffi.pointer(FFI_STRING), []],

  // Error handling
  askar_get_current_error: [FFI_ERROR_CODE, [koffi.out(koffi.pointer(FFI_STRING))]],

  // Buffer management
  askar_buffer_free: [FFI_VOID, [SecretBufferStruct]],

  // Logger functions
  askar_clear_custom_logger: [FFI_VOID, []],
  askar_set_custom_logger: [
    FFI_ERROR_CODE,
    [
      koffi.pointer(FFI_VOID),
      koffi.pointer(FFI_CALLBACK_LOG),
      koffi.pointer(FFI_VOID),
      koffi.pointer(FFI_VOID),
      FFI_INT32,
    ],
  ],
  askar_set_default_logger: [FFI_ERROR_CODE, []],
  askar_set_max_log_level: [FFI_ERROR_CODE, [FFI_INT32]],

  // Argon2
  askar_argon2_derive_password: [
    FFI_ERROR_CODE,
    [
      FFI_INT8,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.pointer(Argon2ConfigStruct),
      koffi.out(koffi.pointer(SecretBufferStruct)),
    ],
  ],

  // Entry list functions
  askar_entry_list_count: [FFI_ERROR_CODE, [FFI_ENTRY_LIST_HANDLE, koffi.out(koffi.pointer(FFI_INT32))]],
  askar_entry_list_free: [FFI_VOID, [FFI_ENTRY_LIST_HANDLE]],
  askar_entry_list_get_category: [
    FFI_ERROR_CODE,
    [FFI_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_entry_list_get_name: [FFI_ERROR_CODE, [FFI_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))]],
  askar_entry_list_get_tags: [FFI_ERROR_CODE, [FFI_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))]],
  askar_entry_list_get_value: [
    FFI_ERROR_CODE,
    [FFI_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(SecretBufferStruct))],
  ],

  // Handle list
  askar_handle_list_free: [FFI_VOID, [FfiHandleListStruct]],

  // String list functions
  askar_string_list_count: [FFI_ERROR_CODE, [FFI_STRING_LIST_HANDLE, koffi.out(koffi.pointer(FFI_INT32))]],
  askar_string_list_free: [FFI_VOID, [FFI_STRING_LIST_HANDLE]],
  askar_string_list_get_item: [
    FFI_ERROR_CODE,
    [FFI_STRING_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],

  // Key AEAD functions
  askar_key_aead_decrypt: [
    FFI_ERROR_CODE,
    [
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.out(koffi.pointer(SecretBufferStruct)),
    ],
  ],
  askar_key_aead_encrypt: [
    FFI_ERROR_CODE,
    [
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.out(koffi.pointer(EncryptedBufferStruct)),
    ],
  ],
  askar_key_aead_get_padding: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, FFI_INT64, koffi.out(koffi.pointer(FFI_INT32))]],
  askar_key_aead_get_params: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(AeadParamsStruct))]],
  askar_key_aead_random_nonce: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(SecretBufferStruct))]],

  // Key functions
  askar_key_convert: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, FFI_STRING, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_crypto_box: [
    FFI_ERROR_CODE,
    [
      FFI_LOCAL_KEY_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.out(koffi.pointer(SecretBufferStruct)),
    ],
  ],
  askar_key_crypto_box_open: [
    FFI_ERROR_CODE,
    [
      FFI_LOCAL_KEY_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.out(koffi.pointer(SecretBufferStruct)),
    ],
  ],
  askar_key_crypto_box_random_nonce: [FFI_ERROR_CODE, [koffi.out(koffi.pointer(SecretBufferStruct))]],
  askar_key_crypto_box_seal: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, ByteBufferStruct, koffi.out(koffi.pointer(SecretBufferStruct))],
  ],
  askar_key_crypto_box_seal_open: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, ByteBufferStruct, koffi.out(koffi.pointer(SecretBufferStruct))],
  ],
  askar_key_derive_ecdh_1pu: [
    FFI_ERROR_CODE,
    [
      FFI_STRING,
      FFI_LOCAL_KEY_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      FFI_INT8,
      koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE)),
    ],
  ],
  askar_key_derive_ecdh_es: [
    FFI_ERROR_CODE,
    [
      FFI_STRING,
      FFI_LOCAL_KEY_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      FFI_INT8,
      koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE)),
    ],
  ],

  // Key entry list functions
  askar_key_entry_list_count: [FFI_ERROR_CODE, [FFI_KEY_ENTRY_LIST_HANDLE, koffi.out(koffi.pointer(FFI_INT32))]],
  askar_key_entry_list_free: [FFI_VOID, [FFI_KEY_ENTRY_LIST_HANDLE]],
  askar_key_entry_list_get_algorithm: [
    FFI_ERROR_CODE,
    [FFI_KEY_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_key_entry_list_get_metadata: [
    FFI_ERROR_CODE,
    [FFI_KEY_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_key_entry_list_get_name: [
    FFI_ERROR_CODE,
    [FFI_KEY_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_key_entry_list_get_tags: [
    FFI_ERROR_CODE,
    [FFI_KEY_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_key_entry_list_load_local: [
    FFI_ERROR_CODE,
    [FFI_KEY_ENTRY_LIST_HANDLE, FFI_INT32, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],

  // Key management
  askar_key_free: [FFI_VOID, [FFI_LOCAL_KEY_HANDLE]],
  askar_key_from_jwk: [FFI_ERROR_CODE, [ByteBufferStruct, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))]],
  askar_key_from_key_exchange: [
    FFI_ERROR_CODE,
    [FFI_STRING, FFI_LOCAL_KEY_HANDLE, FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_from_public_bytes: [
    FFI_ERROR_CODE,
    [FFI_STRING, ByteBufferStruct, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_from_secret_bytes: [
    FFI_ERROR_CODE,
    [FFI_STRING, ByteBufferStruct, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_from_seed: [
    FFI_ERROR_CODE,
    [FFI_STRING, ByteBufferStruct, FFI_STRING, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_generate: [
    FFI_ERROR_CODE,
    [FFI_STRING, FFI_STRING, FFI_INT8, koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE))],
  ],
  askar_key_get_algorithm: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(FFI_STRING))]],
  askar_key_get_ephemeral: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(FFI_INT8))]],
  askar_key_get_jwk_public: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, FFI_STRING, koffi.out(koffi.pointer(FFI_STRING))]],
  askar_key_get_jwk_secret: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(SecretBufferStruct))]],
  askar_key_get_jwk_thumbprint: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, FFI_STRING, koffi.out(koffi.pointer(FFI_STRING))],
  ],
  askar_key_get_public_bytes: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(SecretBufferStruct))]],
  askar_key_get_secret_bytes: [FFI_ERROR_CODE, [FFI_LOCAL_KEY_HANDLE, koffi.out(koffi.pointer(SecretBufferStruct))]],
  askar_key_get_supported_backends: [FFI_ERROR_CODE, [koffi.out(koffi.pointer(FFI_STRING_LIST_HANDLE))]],
  askar_key_sign_message: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, ByteBufferStruct, FFI_STRING, koffi.out(koffi.pointer(SecretBufferStruct))],
  ],
  askar_key_unwrap_key: [
    FFI_ERROR_CODE,
    [
      FFI_LOCAL_KEY_HANDLE,
      FFI_STRING,
      ByteBufferStruct,
      ByteBufferStruct,
      ByteBufferStruct,
      koffi.out(koffi.pointer(FFI_LOCAL_KEY_HANDLE)),
    ],
  ],
  askar_key_verify_signature: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, ByteBufferStruct, ByteBufferStruct, FFI_STRING, koffi.out(koffi.pointer(FFI_INT8))],
  ],
  askar_key_wrap_key: [
    FFI_ERROR_CODE,
    [FFI_LOCAL_KEY_HANDLE, FFI_LOCAL_KEY_HANDLE, ByteBufferStruct, koffi.out(koffi.pointer(EncryptedBufferStruct))],
  ],

  // Scan functions
  askar_scan_free: [FFI_ERROR_CODE, [FFI_SCAN_HANDLE]],
  askar_scan_next: [FFI_ERROR_CODE, [FFI_SCAN_HANDLE, koffi.pointer(FFI_CALLBACK_ENTRY_LIST_HANDLE), FFI_CALLBACK_ID]],
  askar_scan_start: [
    FFI_ERROR_CODE,
    [
      FFI_STORE_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT64,
      FFI_INT64,
      FFI_STRING,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_SCAN_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],

  // Session functions
  askar_session_close: [
    FFI_ERROR_CODE,
    [FFI_SESSION_HANDLE, FFI_INT8, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID],
  ],
  askar_session_count: [
    FFI_ERROR_CODE,
    [FFI_SESSION_HANDLE, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_INT64), FFI_CALLBACK_ID],
  ],
  askar_session_fetch: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_ENTRY_LIST_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_session_fetch_all: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_INT64,
      FFI_STRING,
      FFI_INT8,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_ENTRY_LIST_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_session_fetch_all_keys: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT64,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_KEY_ENTRY_LIST_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_session_fetch_key: [
    FFI_ERROR_CODE,
    [FFI_SESSION_HANDLE, FFI_STRING, FFI_INT8, koffi.pointer(FFI_CALLBACK_KEY_ENTRY_LIST_HANDLE), FFI_CALLBACK_ID],
  ],
  askar_session_insert_key: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_LOCAL_KEY_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT64,
      koffi.pointer(FFI_CALLBACK_NO_RESULT),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_session_remove_all: [
    FFI_ERROR_CODE,
    [FFI_SESSION_HANDLE, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_INT64), FFI_CALLBACK_ID],
  ],
  askar_session_remove_key: [
    FFI_ERROR_CODE,
    [FFI_SESSION_HANDLE, FFI_STRING, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID],
  ],
  askar_session_start: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, FFI_INT8, koffi.pointer(FFI_CALLBACK_SESSION_HANDLE), FFI_CALLBACK_ID],
  ],
  askar_session_update: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_INT8,
      FFI_STRING,
      FFI_STRING,
      ByteBufferStruct,
      FFI_STRING,
      FFI_INT64,
      koffi.pointer(FFI_CALLBACK_NO_RESULT),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_session_update_key: [
    FFI_ERROR_CODE,
    [
      FFI_SESSION_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT64,
      koffi.pointer(FFI_CALLBACK_NO_RESULT),
      FFI_CALLBACK_ID,
    ],
  ],

  // Store functions
  askar_store_close: [FFI_ERROR_CODE, [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID]],
  askar_store_copy: [
    FFI_ERROR_CODE,
    [
      FFI_STORE_HANDLE,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_STORE_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_store_copy_profile: [
    FFI_ERROR_CODE,
    [
      FFI_STORE_HANDLE,
      FFI_STORE_HANDLE,
      FFI_STRING,
      FFI_STRING,
      koffi.pointer(FFI_CALLBACK_NO_RESULT),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_store_create_profile: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, koffi.pointer(FFI_CALLBACK_STRING), FFI_CALLBACK_ID],
  ],
  askar_store_generate_raw_key: [FFI_ERROR_CODE, [ByteBufferStruct, koffi.out(koffi.pointer(FFI_STRING))]],
  askar_store_get_default_profile: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_STRING), FFI_CALLBACK_ID],
  ],
  askar_store_get_profile_name: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_STRING), FFI_CALLBACK_ID],
  ],
  askar_store_list_profiles: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_STRING_LIST_HANDLE), FFI_CALLBACK_ID],
  ],
  askar_store_list_scans: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_HANDLE_LIST), FFI_CALLBACK_ID],
  ],
  askar_store_list_sessions: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, koffi.pointer(FFI_CALLBACK_HANDLE_LIST), FFI_CALLBACK_ID],
  ],
  askar_store_open: [
    FFI_ERROR_CODE,
    [FFI_STRING, FFI_STRING, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_STORE_HANDLE), FFI_CALLBACK_ID],
  ],
  askar_store_provision: [
    FFI_ERROR_CODE,
    [
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_STRING,
      FFI_INT8,
      koffi.pointer(FFI_CALLBACK_STORE_HANDLE),
      FFI_CALLBACK_ID,
    ],
  ],
  askar_store_rekey: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID],
  ],
  askar_store_remove: [FFI_ERROR_CODE, [FFI_STRING, koffi.pointer(FFI_CALLBACK_INT8), FFI_CALLBACK_ID]],
  askar_store_remove_profile: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, koffi.pointer(FFI_CALLBACK_INT8), FFI_CALLBACK_ID],
  ],
  askar_store_rename_profile: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_INT8), FFI_CALLBACK_ID],
  ],
  askar_store_set_default_profile: [
    FFI_ERROR_CODE,
    [FFI_STORE_HANDLE, FFI_STRING, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID],
  ],

  // Migration
  askar_migrate_indy_sdk: [
    FFI_ERROR_CODE,
    [FFI_STRING, FFI_STRING, FFI_STRING, FFI_STRING, koffi.pointer(FFI_CALLBACK_NO_RESULT), FFI_CALLBACK_ID],
  ],
} as const
