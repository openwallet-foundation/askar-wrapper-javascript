import {
  FFI_CALLBACK_ID,
  FFI_ENTRY_LIST_HANDLE,
  FFI_ERROR_CODE,
  FFI_INT8,
  FFI_INT8_PTR,
  FFI_INT32,
  FFI_INT32_PTR,
  FFI_INT64,
  FFI_KEY_ENTRY_LIST_HANDLE,
  FFI_POINTER,
  FFI_SCAN_HANDLE,
  FFI_SESSION_HANDLE,
  FFI_STORE_HANDLE,
  FFI_STRING,
  FFI_STRING_LIST_HANDLE,
  FFI_STRING_PTR,
  FFI_VOID,
} from '../ffi'

// Struct type names for koffi function signatures
const ByteBufferType = 'ByteBuffer'
const SecretBufferType = 'ByteBuffer' // SecretBuffer is same as ByteBuffer
const EncryptedBufferType = 'EncryptedBuffer'
const AeadParamsType = 'AeadParams'

// Callback signatures for koffi - must NOT be pointers in signatures
// koffi expects callback types without the * pointer syntax
// Basic callback with no response
const CallbackBasic = 'void *' // Generic callback pointer
// Callback with string response
const CallbackString = 'void *' // Generic callback pointer
// Callback with size_t response (for handles)
const CallbackHandle = 'void *' // Generic callback pointer
// Log callback
const CallbackLog = 'void *' // Generic callback pointer

// Koffi uses C-like function signatures as strings
export const nativeBindings = {
  askar_terminate: `${FFI_VOID} askar_terminate()`,
  askar_version: `${FFI_STRING} askar_version()`,
  askar_get_current_error: `${FFI_ERROR_CODE} askar_get_current_error(_Out_ ${FFI_STRING_PTR} errorOut)`,
  askar_buffer_free: `${FFI_VOID} askar_buffer_free(${ByteBufferType} buffer)`,
  askar_clear_custom_logger: `${FFI_VOID} askar_clear_custom_logger()`,
  askar_set_custom_logger: `${FFI_ERROR_CODE} askar_set_custom_logger(${FFI_INT32} context, ${CallbackLog} log, ${FFI_INT32} enabled, ${FFI_INT32} flush, ${FFI_INT32} maxLevel)`,
  askar_set_default_logger: `${FFI_ERROR_CODE} askar_set_default_logger()`,
  askar_set_max_log_level: `${FFI_ERROR_CODE} askar_set_max_log_level(${FFI_INT32} maxLevel)`,

  askar_argon2_derive_password: `${FFI_ERROR_CODE} askar_argon2_derive_password(${FFI_INT8} parameters, ${ByteBufferType} password, ${ByteBufferType} salt, _Out_ ${SecretBufferType} *ret)`,

  askar_entry_list_count: `${FFI_ERROR_CODE} askar_entry_list_count(${FFI_ENTRY_LIST_HANDLE} handle, _Out_ ${FFI_INT32_PTR} count)`,
  askar_entry_list_free: `${FFI_VOID} askar_entry_list_free(${FFI_ENTRY_LIST_HANDLE} handle)`,
  askar_entry_list_get_category: `${FFI_ERROR_CODE} askar_entry_list_get_category(${FFI_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} category)`,
  askar_entry_list_get_name: `${FFI_ERROR_CODE} askar_entry_list_get_name(${FFI_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} name)`,
  askar_entry_list_get_tags: `${FFI_ERROR_CODE} askar_entry_list_get_tags(${FFI_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} tags)`,
  askar_entry_list_get_value: `${FFI_ERROR_CODE} askar_entry_list_get_value(${FFI_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${SecretBufferType} *value)`,

  askar_string_list_count: `${FFI_ERROR_CODE} askar_string_list_count(${FFI_STRING_LIST_HANDLE} handle, _Out_ ${FFI_INT32_PTR} count)`,
  askar_string_list_free: `${FFI_VOID} askar_string_list_free(${FFI_STRING_LIST_HANDLE} handle)`,
  askar_string_list_get_item: `${FFI_ERROR_CODE} askar_string_list_get_item(${FFI_STRING_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} item)`,

  askar_key_aead_decrypt: `${FFI_ERROR_CODE} askar_key_aead_decrypt(${FFI_POINTER} handle, ${ByteBufferType} ciphertext, ${ByteBufferType} nonce, ${ByteBufferType} tag, ${ByteBufferType} aad, _Out_ ${SecretBufferType} *plaintext)`,
  askar_key_aead_encrypt: `${FFI_ERROR_CODE} askar_key_aead_encrypt(${FFI_POINTER} handle, ${ByteBufferType} message, ${ByteBufferType} nonce, ${ByteBufferType} aad, _Out_ ${EncryptedBufferType} *ciphertext)`,
  askar_key_aead_get_padding: `${FFI_ERROR_CODE} askar_key_aead_get_padding(${FFI_POINTER} handle, ${FFI_INT64} msgLen, _Out_ ${FFI_INT32_PTR} padding)`,
  askar_key_aead_get_params: `${FFI_ERROR_CODE} askar_key_aead_get_params(${FFI_POINTER} handle, _Out_ ${AeadParamsType} *params)`,
  askar_key_aead_random_nonce: `${FFI_ERROR_CODE} askar_key_aead_random_nonce(${FFI_POINTER} handle, _Out_ ${SecretBufferType} *nonce)`,
  askar_key_convert: `${FFI_ERROR_CODE} askar_key_convert(${FFI_POINTER} handle, ${FFI_STRING} algorithm, _Out_ void **keyOut)`,
  askar_key_crypto_box: `${FFI_ERROR_CODE} askar_key_crypto_box(${FFI_POINTER} recipKey, ${FFI_POINTER} senderKey, ${ByteBufferType} message, ${ByteBufferType} nonce, _Out_ ${SecretBufferType} *out)`,
  askar_key_crypto_box_open: `${FFI_ERROR_CODE} askar_key_crypto_box_open(${FFI_POINTER} recipKey, ${FFI_POINTER} senderKey, ${ByteBufferType} message, ${ByteBufferType} nonce, _Out_ ${SecretBufferType} *out)`,
  askar_key_crypto_box_random_nonce: `${FFI_ERROR_CODE} askar_key_crypto_box_random_nonce(_Out_ ${SecretBufferType} *nonce)`,
  askar_key_crypto_box_seal: `${FFI_ERROR_CODE} askar_key_crypto_box_seal(${FFI_POINTER} handle, ${ByteBufferType} message, _Out_ ${SecretBufferType} *out)`,
  askar_key_crypto_box_seal_open: `${FFI_ERROR_CODE} askar_key_crypto_box_seal_open(${FFI_POINTER} handle, ${ByteBufferType} ciphertext, _Out_ ${SecretBufferType} *out)`,
  askar_key_derive_ecdh_1pu: `${FFI_ERROR_CODE} askar_key_derive_ecdh_1pu(${FFI_STRING} algorithm, ${FFI_POINTER} ephemeralKey, ${FFI_POINTER} senderKey, ${FFI_POINTER} recipientKey, ${ByteBufferType} algId, ${ByteBufferType} apu, ${ByteBufferType} apv, ${ByteBufferType} ccTag, ${FFI_INT8} receive, _Out_ void **out)`,
  askar_key_derive_ecdh_es: `${FFI_ERROR_CODE} askar_key_derive_ecdh_es(${FFI_STRING} algorithm, ${FFI_POINTER} ephemeralKey, ${FFI_POINTER} recipientKey, ${ByteBufferType} algId, ${ByteBufferType} apu, ${ByteBufferType} apv, ${FFI_INT8} receive, _Out_ void **out)`,
  askar_key_entry_list_count: `${FFI_ERROR_CODE} askar_key_entry_list_count(${FFI_KEY_ENTRY_LIST_HANDLE} handle, _Out_ ${FFI_INT32_PTR} count)`,
  askar_key_entry_list_free: `${FFI_VOID} askar_key_entry_list_free(${FFI_KEY_ENTRY_LIST_HANDLE} handle)`,
  askar_key_entry_list_get_algorithm: `${FFI_ERROR_CODE} askar_key_entry_list_get_algorithm(${FFI_KEY_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} alg)`,
  askar_key_entry_list_get_metadata: `${FFI_ERROR_CODE} askar_key_entry_list_get_metadata(${FFI_KEY_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} metadata)`,
  askar_key_entry_list_get_name: `${FFI_ERROR_CODE} askar_key_entry_list_get_name(${FFI_KEY_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} name)`,
  askar_key_entry_list_get_tags: `${FFI_ERROR_CODE} askar_key_entry_list_get_tags(${FFI_KEY_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ ${FFI_STRING_PTR} tags)`,
  askar_key_entry_list_load_local: `${FFI_ERROR_CODE} askar_key_entry_list_load_local(${FFI_KEY_ENTRY_LIST_HANDLE} handle, ${FFI_INT32} index, _Out_ void **out)`,
  askar_key_free: `${FFI_VOID} askar_key_free(${FFI_POINTER} handle)`,
  askar_key_from_jwk: `${FFI_ERROR_CODE} askar_key_from_jwk(${ByteBufferType} jwk, _Out_ void **out)`,
  askar_key_from_key_exchange: `${FFI_ERROR_CODE} askar_key_from_key_exchange(${FFI_STRING} algorithm, ${FFI_POINTER} skHandle, ${FFI_POINTER} pkHandle, _Out_ void **out)`,
  askar_key_from_public_bytes: `${FFI_ERROR_CODE} askar_key_from_public_bytes(${FFI_STRING} algorithm, ${ByteBufferType} publicKey, _Out_ void **out)`,
  askar_key_from_secret_bytes: `${FFI_ERROR_CODE} askar_key_from_secret_bytes(${FFI_STRING} algorithm, ${ByteBufferType} secretKey, _Out_ void **out)`,
  askar_key_from_seed: `${FFI_ERROR_CODE} askar_key_from_seed(${FFI_STRING} algorithm, ${ByteBufferType} seed, ${FFI_STRING} method, _Out_ void **out)`,
  askar_key_generate: `${FFI_ERROR_CODE} askar_key_generate(${FFI_STRING} algorithm, ${FFI_STRING} backend, ${FFI_INT8} ephemeral, _Out_ void **out)`,
  askar_key_get_algorithm: `${FFI_ERROR_CODE} askar_key_get_algorithm(${FFI_POINTER} handle, _Out_ ${FFI_STRING_PTR} alg)`,
  askar_key_get_ephemeral: `${FFI_ERROR_CODE} askar_key_get_ephemeral(${FFI_POINTER} handle, _Out_ ${FFI_INT8_PTR} ephemeral)`,
  askar_key_get_jwk_public: `${FFI_ERROR_CODE} askar_key_get_jwk_public(${FFI_POINTER} handle, ${FFI_STRING} algorithm, _Out_ ${FFI_STRING_PTR} jwk)`,
  askar_key_get_jwk_secret: `${FFI_ERROR_CODE} askar_key_get_jwk_secret(${FFI_POINTER} handle, _Out_ ${SecretBufferType} *jwk)`,
  askar_key_get_jwk_thumbprint: `${FFI_ERROR_CODE} askar_key_get_jwk_thumbprint(${FFI_POINTER} handle, ${FFI_STRING} algorithm, _Out_ ${FFI_STRING_PTR} thumbprint)`,
  askar_key_get_public_bytes: `${FFI_ERROR_CODE} askar_key_get_public_bytes(${FFI_POINTER} handle, _Out_ ${SecretBufferType} *out)`,
  askar_key_get_secret_bytes: `${FFI_ERROR_CODE} askar_key_get_secret_bytes(${FFI_POINTER} handle, _Out_ ${SecretBufferType} *out)`,
  askar_key_sign_message: `${FFI_ERROR_CODE} askar_key_sign_message(${FFI_POINTER} handle, ${ByteBufferType} message, ${FFI_STRING} sigType, _Out_ ${SecretBufferType} *out)`,
  askar_key_unwrap_key: `${FFI_ERROR_CODE} askar_key_unwrap_key(${FFI_POINTER} handle, ${FFI_STRING} algorithm, ${ByteBufferType} ciphertext, ${ByteBufferType} nonce, ${ByteBufferType} tag, _Out_ void **out)`,
  askar_key_verify_signature: `${FFI_ERROR_CODE} askar_key_verify_signature(${FFI_POINTER} handle, ${ByteBufferType} message, ${ByteBufferType} signature, ${FFI_STRING} sigType, _Out_ ${FFI_INT8_PTR} valid)`,
  askar_key_wrap_key: `${FFI_ERROR_CODE} askar_key_wrap_key(${FFI_POINTER} handle, ${FFI_POINTER} other, ${ByteBufferType} nonce, _Out_ ${EncryptedBufferType} *out)`,
  askar_key_get_supported_backends: `${FFI_ERROR_CODE} askar_key_get_supported_backends(_Out_ ${FFI_STRING_LIST_HANDLE} *out)`,

  askar_scan_free: `${FFI_ERROR_CODE} askar_scan_free(${FFI_SCAN_HANDLE} handle)`,
  askar_scan_next: `${FFI_ERROR_CODE} askar_scan_next(${FFI_SCAN_HANDLE} handle, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_scan_start: `${FFI_ERROR_CODE} askar_scan_start(${FFI_STORE_HANDLE} handle, ${FFI_STRING} profile, ${FFI_STRING} category, ${FFI_STRING} tagFilter, ${FFI_INT64} offset, ${FFI_INT64} limit, ${FFI_STRING} orderBy, ${FFI_INT8} descending, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,

  askar_session_close: `${FFI_ERROR_CODE} askar_session_close(${FFI_SESSION_HANDLE} handle, ${FFI_INT8} commit, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_count: `${FFI_ERROR_CODE} askar_session_count(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} category, ${FFI_STRING} tagFilter, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_fetch: `${FFI_ERROR_CODE} askar_session_fetch(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} category, ${FFI_STRING} name, ${FFI_INT8} forUpdate, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_fetch_all: `${FFI_ERROR_CODE} askar_session_fetch_all(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} category, ${FFI_STRING} tagFilter, ${FFI_INT64} limit, ${FFI_STRING} orderBy, ${FFI_INT8} descending, ${FFI_INT8} forUpdate, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_fetch_all_keys: `${FFI_ERROR_CODE} askar_session_fetch_all_keys(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} algorithm, ${FFI_STRING} thumbprint, ${FFI_STRING} tagFilter, ${FFI_INT64} limit, ${FFI_INT8} forUpdate, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_fetch_key: `${FFI_ERROR_CODE} askar_session_fetch_key(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} name, ${FFI_INT8} forUpdate, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_insert_key: `${FFI_ERROR_CODE} askar_session_insert_key(${FFI_SESSION_HANDLE} handle, ${FFI_POINTER} localKeyHandle, ${FFI_STRING} name, ${FFI_STRING} metadata, ${FFI_STRING} tags, ${FFI_INT64} expiryMs, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_remove_all: `${FFI_ERROR_CODE} askar_session_remove_all(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} category, ${FFI_STRING} tagFilter, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_remove_key: `${FFI_ERROR_CODE} askar_session_remove_key(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} name, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_start: `${FFI_ERROR_CODE} askar_session_start(${FFI_STORE_HANDLE} handle, ${FFI_STRING} profile, ${FFI_INT8} asTransaction, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_update: `${FFI_ERROR_CODE} askar_session_update(${FFI_SESSION_HANDLE} handle, ${FFI_INT8} operation, ${FFI_STRING} category, ${FFI_STRING} name, ${ByteBufferType} value, ${FFI_STRING} tags, ${FFI_INT64} expiryMs, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_session_update_key: `${FFI_ERROR_CODE} askar_session_update_key(${FFI_SESSION_HANDLE} handle, ${FFI_STRING} name, ${FFI_STRING} metadata, ${FFI_STRING} tags, ${FFI_INT64} expiryMs, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,

  askar_store_close: `${FFI_ERROR_CODE} askar_store_close(${FFI_STORE_HANDLE} handle, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_copy: `${FFI_ERROR_CODE} askar_store_copy(${FFI_STORE_HANDLE} handle, ${FFI_STRING} targetUri, ${FFI_STRING} keyMethod, ${FFI_STRING} passKey, ${FFI_INT8} recreate, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_create_profile: `${FFI_ERROR_CODE} askar_store_create_profile(${FFI_STORE_HANDLE} handle, ${FFI_STRING} profile, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_generate_raw_key: `${FFI_ERROR_CODE} askar_store_generate_raw_key(${ByteBufferType} seed, _Out_ ${FFI_STRING_PTR} out)`,
  askar_store_get_profile_name: `${FFI_ERROR_CODE} askar_store_get_profile_name(${FFI_STORE_HANDLE} handle, ${CallbackString} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_get_default_profile: `${FFI_ERROR_CODE} askar_store_get_default_profile(${FFI_STORE_HANDLE} handle, ${CallbackString} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_list_profiles: `${FFI_ERROR_CODE} askar_store_list_profiles(${FFI_STORE_HANDLE} handle, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_open: `${FFI_ERROR_CODE} askar_store_open(${FFI_STRING} specUri, ${FFI_STRING} keyMethod, ${FFI_STRING} passKey, ${FFI_STRING} profile, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_provision: `${FFI_ERROR_CODE} askar_store_provision(${FFI_STRING} specUri, ${FFI_STRING} keyMethod, ${FFI_STRING} passKey, ${FFI_STRING} profile, ${FFI_INT8} recreate, ${CallbackHandle} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_rekey: `${FFI_ERROR_CODE} askar_store_rekey(${FFI_STORE_HANDLE} handle, ${FFI_STRING} keyMethod, ${FFI_STRING} passKey, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_remove: `${FFI_ERROR_CODE} askar_store_remove(${FFI_STRING} specUri, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_remove_profile: `${FFI_ERROR_CODE} askar_store_remove_profile(${FFI_STORE_HANDLE} handle, ${FFI_STRING} profile, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_set_default_profile: `${FFI_ERROR_CODE} askar_store_set_default_profile(${FFI_STORE_HANDLE} handle, ${FFI_STRING} profile, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_rename_profile: `${FFI_ERROR_CODE} askar_store_rename_profile(${FFI_STORE_HANDLE} handle, ${FFI_STRING} fromProfile, ${FFI_STRING} toProfile, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
  askar_store_copy_profile: `${FFI_ERROR_CODE} askar_store_copy_profile(${FFI_STORE_HANDLE} fromHandle, ${FFI_STORE_HANDLE} toHandle, ${FFI_STRING} fromProfile, ${FFI_STRING} toProfile, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,

  askar_migrate_indy_sdk: `${FFI_ERROR_CODE} askar_migrate_indy_sdk(${FFI_STRING} specUri, ${FFI_STRING} walletName, ${FFI_STRING} walletKey, ${FFI_STRING} kdfLevel, ${CallbackBasic} cb, ${FFI_CALLBACK_ID} cbId)`,
} as const
