#pragma once

#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

#define PAGE_SIZE 32

typedef size_t ScanHandle;
typedef size_t StoreHandle;
typedef size_t SessionHandle;

enum ErrorCode
#ifdef __cplusplus
  : int64_t
#endif // __cplusplus
 {
  Success = 0,
  Backend = 1,
  Busy = 2,
  Duplicate = 3,
  Encryption = 4,
  Input = 5,
  NotFound = 6,
  Unexpected = 7,
  Unsupported = 8,
  Custom = 100,
};
#ifndef __cplusplus
typedef int64_t ErrorCode;
#endif // __cplusplus

typedef struct FfiResultList_Entry FfiResultList_Entry;

typedef struct FfiResultList_KeyEntry FfiResultList_KeyEntry;

/**
 * A stored key entry
 */
typedef struct LocalKey LocalKey;

typedef struct Option_EnabledCallback Option_EnabledCallback;

typedef struct Option_FlushCallback Option_FlushCallback;

typedef struct SecretBuffer {
  int64_t len;
  uint8_t *data;
} SecretBuffer;

typedef struct FfiResultList_Entry FfiEntryList;

typedef struct ArcHandle_FfiEntryList {
  const FfiEntryList *_0;
} ArcHandle_FfiEntryList;

typedef struct ArcHandle_FfiEntryList EntryListHandle;

typedef struct ArcHandle_LocalKey {
  const struct LocalKey *_0;
} ArcHandle_LocalKey;

typedef struct ArcHandle_LocalKey LocalKeyHandle;

/**
 * ByteBuffer is a struct that represents an array of bytes to be sent over the FFI boundaries.
 * There are several cases when you might want to use this, but the primary one for us
 * is for returning protobuf-encoded data to Swift and Java. The type is currently rather
 * limited (implementing almost no functionality), however in the future it may be
 * more expanded.
 *
 * ## Caveats
 *
 * Note that the order of the fields is `len` (an i64) then `data` (a `*mut u8`), getting
 * this wrong on the other side of the FFI will cause memory corruption and crashes.
 * `i64` is used for the length instead of `u64` and `usize` because JNA has interop
 * issues with both these types.
 *
 * ### `Drop` is not implemented
 *
 * ByteBuffer does not implement Drop. This is intentional. Memory passed into it will
 * be leaked if it is not explicitly destroyed by calling [`ByteBuffer::destroy`], or
 * [`ByteBuffer::destroy_into_vec`]. This is for two reasons:
 *
 * 1. In the future, we may allow it to be used for data that is not managed by
 *    the Rust allocator\*, and `ByteBuffer` assuming it's okay to automatically
 *    deallocate this data with the Rust allocator.
 *
 * 2. Automatically running destructors in unsafe code is a
 *    [frequent footgun](https://without.boats/blog/two-memory-bugs-from-ringbahn/)
 *    (among many similar issues across many crates).
 *
 * Note that calling `destroy` manually is often not needed, as usually you should
 * be passing these to the function defined by [`define_bytebuffer_destructor!`] from
 * the other side of the FFI.
 *
 * Because this type is essentially *only* useful in unsafe or FFI code (and because
 * the most common usage pattern does not require manually managing the memory), it
 * does not implement `Drop`.
 *
 * \* Note: in the case of multiple Rust shared libraries loaded at the same time,
 * there may be multiple instances of "the Rust allocator" (one per shared library),
 * in which case we're referring to whichever instance is active for the code using
 * the `ByteBuffer`. Note that this doesn't occur on all platforms or build
 * configurations, but treating allocators in different shared libraries as fully
 * independent is always safe.
 *
 * ## Layout/fields
 *
 * This struct's field are not `pub` (mostly so that we can soundly implement `Send`, but also so
 * that we can verify rust users are constructing them appropriately), the fields, their types, and
 * their order are *very much* a part of the public API of this type. Consumers on the other side
 * of the FFI will need to know its layout.
 *
 * If this were a C struct, it would look like
 *
 * ```c,no_run
 * struct ByteBuffer {
 *     // Note: This should never be negative, but values above
 *     // INT64_MAX / i64::MAX are not allowed.
 *     int64_t len;
 *     // Note: nullable!
 *     uint8_t *data;
 * };
 * ```
 *
 * In rust, there are two fields, in this order: `len: i64`, and `data: *mut u8`.
 *
 * For clarity, the fact that the data pointer is nullable means that `Option<ByteBuffer>` is not
 * the same size as ByteBuffer, and additionally is not FFI-safe (the latter point is not
 * currently guaranteed anyway as of the time of writing this comment).
 *
 * ### Description of fields
 *
 * `data` is a pointer to an array of `len` bytes. Note that data can be a null pointer and therefore
 * should be checked.
 *
 * The bytes array is allocated on the heap and must be freed on it as well. Critically, if there
 * are multiple rust shared libraries using being used in the same application, it *must be freed
 * on the same heap that allocated it*, or you will corrupt both heaps.
 *
 * Typically, this object is managed on the other side of the FFI (on the "FFI consumer"), which
 * means you must expose a function to release the resources of `data` which can be done easily
 * using the [`define_bytebuffer_destructor!`] macro provided by this crate.
 */
typedef struct ByteBuffer {
  int64_t len;
  uint8_t *data;
} ByteBuffer;

typedef struct EncryptedBuffer {
  struct SecretBuffer buffer;
  int64_t tag_pos;
  int64_t nonce_pos;
} EncryptedBuffer;

typedef struct AeadParams {
  int32_t nonce_length;
  int32_t tag_length;
} AeadParams;

/**
 * `FfiStr<'a>` is a safe (`#[repr(transparent)]`) wrapper around a
 * nul-terminated `*const c_char` (e.g. a C string). Conceptually, it is
 * similar to [`std::ffi::CStr`], except that it may be used in the signatures
 * of extern "C" functions.
 *
 * Functions accepting strings should use this instead of accepting a C string
 * directly. This allows us to write those functions using safe code without
 * allowing safe Rust to cause memory unsafety.
 *
 * A single function for constructing these from Rust ([`FfiStr::from_raw`])
 * has been provided. Most of the time, this should not be necessary, and users
 * should accept `FfiStr` in the parameter list directly.
 *
 * ## Caveats
 *
 * An effort has been made to make this struct hard to misuse, however it is
 * still possible, if the `'static` lifetime is manually specified in the
 * struct. E.g.
 *
 * ```rust,no_run
 * # use ffi_support::FfiStr;
 * // NEVER DO THIS
 * #[no_mangle]
 * extern "C" fn never_do_this(s: FfiStr<'static>) {
 *     // save `s` somewhere, and access it after this
 *     // function returns.
 * }
 * ```
 *
 * Instead, one of the following patterns should be used:
 *
 * ```
 * # use ffi_support::FfiStr;
 * #[no_mangle]
 * extern "C" fn valid_use_1(s: FfiStr<'_>) {
 *     // Use of `s` after this function returns is impossible
 * }
 * // Alternative:
 * #[no_mangle]
 * extern "C" fn valid_use_2(s: FfiStr) {
 *     // Use of `s` after this function returns is impossible
 * }
 * ```
 */
typedef const char *FfiStr;

typedef struct FfiResultList_KeyEntry FfiKeyEntryList;

typedef struct ArcHandle_FfiKeyEntryList {
  const FfiKeyEntryList *_0;
} ArcHandle_FfiKeyEntryList;

typedef struct ArcHandle_FfiKeyEntryList KeyEntryListHandle;

typedef int64_t CallbackId;

typedef void (*LogCallback)(const void *context, int32_t level, const char *target, const char *message, const char *module_path, const char *file, int32_t line);

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus

void askar_buffer_free(struct SecretBuffer buffer);

void askar_clear_custom_logger(void);

ErrorCode askar_entry_list_count(EntryListHandle handle, int32_t *count);

void askar_entry_list_free(EntryListHandle handle);

ErrorCode askar_entry_list_get_category(EntryListHandle handle,
                                        int32_t index,
                                        const char **category);

ErrorCode askar_entry_list_get_name(EntryListHandle handle, int32_t index, const char **name);

ErrorCode askar_entry_list_get_tags(EntryListHandle handle, int32_t index, const char **tags);

ErrorCode askar_entry_list_get_value(EntryListHandle handle,
                                     int32_t index,
                                     struct SecretBuffer *value);

ErrorCode askar_get_current_error(const char **error_json_p);

ErrorCode askar_key_aead_decrypt(LocalKeyHandle handle,
                                 struct ByteBuffer ciphertext,
                                 struct ByteBuffer nonce,
                                 struct ByteBuffer tag,
                                 struct ByteBuffer aad,
                                 struct SecretBuffer *out);

ErrorCode askar_key_aead_encrypt(LocalKeyHandle handle,
                                 struct ByteBuffer message,
                                 struct ByteBuffer nonce,
                                 struct ByteBuffer aad,
                                 struct EncryptedBuffer *out);

ErrorCode askar_key_aead_get_padding(LocalKeyHandle handle, int64_t msg_len, int32_t *out);

ErrorCode askar_key_aead_get_params(LocalKeyHandle handle, struct AeadParams *out);

ErrorCode askar_key_aead_random_nonce(LocalKeyHandle handle, struct SecretBuffer *out);

ErrorCode askar_key_convert(LocalKeyHandle handle, FfiStr alg, LocalKeyHandle *out);

ErrorCode askar_key_crypto_box(LocalKeyHandle recip_key,
                               LocalKeyHandle sender_key,
                               struct ByteBuffer message,
                               struct ByteBuffer nonce,
                               struct SecretBuffer *out);

ErrorCode askar_key_crypto_box_open(LocalKeyHandle recip_key,
                                    LocalKeyHandle sender_key,
                                    struct ByteBuffer message,
                                    struct ByteBuffer nonce,
                                    struct SecretBuffer *out);

ErrorCode askar_key_crypto_box_random_nonce(struct SecretBuffer *out);

ErrorCode askar_key_crypto_box_seal(LocalKeyHandle handle,
                                    struct ByteBuffer message,
                                    struct SecretBuffer *out);

ErrorCode askar_key_crypto_box_seal_open(LocalKeyHandle handle,
                                         struct ByteBuffer ciphertext,
                                         struct SecretBuffer *out);

ErrorCode askar_key_derive_ecdh_1pu(FfiStr alg,
                                    LocalKeyHandle ephem_key,
                                    LocalKeyHandle sender_key,
                                    LocalKeyHandle recip_key,
                                    struct ByteBuffer alg_id,
                                    struct ByteBuffer apu,
                                    struct ByteBuffer apv,
                                    struct ByteBuffer cc_tag,
                                    int8_t receive,
                                    LocalKeyHandle *out);

ErrorCode askar_key_derive_ecdh_es(FfiStr alg,
                                   LocalKeyHandle ephem_key,
                                   LocalKeyHandle recip_key,
                                   struct ByteBuffer alg_id,
                                   struct ByteBuffer apu,
                                   struct ByteBuffer apv,
                                   int8_t receive,
                                   LocalKeyHandle *out);

ErrorCode askar_key_entry_list_count(KeyEntryListHandle handle, int32_t *count);

void askar_key_entry_list_free(KeyEntryListHandle handle);

ErrorCode askar_key_entry_list_get_algorithm(KeyEntryListHandle handle,
                                             int32_t index,
                                             const char **alg);

ErrorCode askar_key_entry_list_get_metadata(KeyEntryListHandle handle,
                                            int32_t index,
                                            const char **metadata);

ErrorCode askar_key_entry_list_get_name(KeyEntryListHandle handle,
                                        int32_t index,
                                        const char **name);

ErrorCode askar_key_entry_list_get_tags(KeyEntryListHandle handle,
                                        int32_t index,
                                        const char **tags);

ErrorCode askar_key_entry_list_load_local(KeyEntryListHandle handle,
                                          int32_t index,
                                          LocalKeyHandle *out);

void askar_key_free(LocalKeyHandle handle);

ErrorCode askar_key_from_jwk(struct ByteBuffer jwk, LocalKeyHandle *out);

ErrorCode askar_key_from_key_exchange(FfiStr alg,
                                      LocalKeyHandle sk_handle,
                                      LocalKeyHandle pk_handle,
                                      LocalKeyHandle *out);

ErrorCode askar_key_from_public_bytes(FfiStr alg, struct ByteBuffer public_, LocalKeyHandle *out);

ErrorCode askar_key_from_secret_bytes(FfiStr alg, struct ByteBuffer secret, LocalKeyHandle *out);

ErrorCode askar_key_from_seed(FfiStr alg,
                              struct ByteBuffer seed,
                              FfiStr method,
                              LocalKeyHandle *out);

ErrorCode askar_key_generate(FfiStr alg, int8_t ephemeral, LocalKeyHandle *out);

ErrorCode askar_key_get_algorithm(LocalKeyHandle handle, const char **out);

ErrorCode askar_key_get_ephemeral(LocalKeyHandle handle, int8_t *out);

ErrorCode askar_key_get_jwk_public(LocalKeyHandle handle, FfiStr alg, const char **out);

ErrorCode askar_key_get_jwk_secret(LocalKeyHandle handle, struct SecretBuffer *out);

ErrorCode askar_key_get_jwk_thumbprint(LocalKeyHandle handle, FfiStr alg, const char **out);

ErrorCode askar_key_get_public_bytes(LocalKeyHandle handle, struct SecretBuffer *out);

ErrorCode askar_key_get_secret_bytes(LocalKeyHandle handle, struct SecretBuffer *out);

ErrorCode askar_key_sign_message(LocalKeyHandle handle,
                                 struct ByteBuffer message,
                                 FfiStr sig_type,
                                 struct SecretBuffer *out);

ErrorCode askar_key_unwrap_key(LocalKeyHandle handle,
                               FfiStr alg,
                               struct ByteBuffer ciphertext,
                               struct ByteBuffer nonce,
                               struct ByteBuffer tag,
                               LocalKeyHandle *out);

ErrorCode askar_key_verify_signature(LocalKeyHandle handle,
                                     struct ByteBuffer message,
                                     struct ByteBuffer signature,
                                     FfiStr sig_type,
                                     int8_t *out);

ErrorCode askar_key_wrap_key(LocalKeyHandle handle,
                             LocalKeyHandle other,
                             struct ByteBuffer nonce,
                             struct EncryptedBuffer *out);

ErrorCode askar_scan_free(ScanHandle handle);

ErrorCode askar_scan_next(ScanHandle handle,
                          void (*cb)(CallbackId cb_id, ErrorCode err, EntryListHandle results),
                          CallbackId cb_id);

ErrorCode askar_scan_start(StoreHandle handle,
                           FfiStr profile,
                           FfiStr category,
                           FfiStr tag_filter,
                           int64_t offset,
                           int64_t limit,
                           void (*cb)(CallbackId cb_id, ErrorCode err, ScanHandle handle),
                           CallbackId cb_id);

ErrorCode askar_session_close(SessionHandle handle,
                              int8_t commit,
                              void (*cb)(CallbackId cb_id, ErrorCode err),
                              CallbackId cb_id);

ErrorCode askar_session_count(SessionHandle handle,
                              FfiStr category,
                              FfiStr tag_filter,
                              void (*cb)(CallbackId cb_id, ErrorCode err, int64_t count),
                              CallbackId cb_id);

ErrorCode askar_session_fetch(SessionHandle handle,
                              FfiStr category,
                              FfiStr name,
                              int8_t for_update,
                              void (*cb)(CallbackId cb_id, ErrorCode err, EntryListHandle results),
                              CallbackId cb_id);

ErrorCode askar_session_fetch_all(SessionHandle handle,
                                  FfiStr category,
                                  FfiStr tag_filter,
                                  int64_t limit,
                                  int8_t for_update,
                                  void (*cb)(CallbackId cb_id, ErrorCode err, EntryListHandle results),
                                  CallbackId cb_id);

ErrorCode askar_session_fetch_all_keys(SessionHandle handle,
                                       FfiStr alg,
                                       FfiStr thumbprint,
                                       FfiStr tag_filter,
                                       int64_t limit,
                                       int8_t for_update,
                                       void (*cb)(CallbackId cb_id, ErrorCode err, KeyEntryListHandle results),
                                       CallbackId cb_id);

ErrorCode askar_session_fetch_key(SessionHandle handle,
                                  FfiStr name,
                                  int8_t for_update,
                                  void (*cb)(CallbackId cb_id, ErrorCode err, KeyEntryListHandle results),
                                  CallbackId cb_id);

ErrorCode askar_session_insert_key(SessionHandle handle,
                                   LocalKeyHandle key_handle,
                                   FfiStr name,
                                   FfiStr metadata,
                                   FfiStr tags,
                                   int64_t expiry_ms,
                                   void (*cb)(CallbackId cb_id, ErrorCode err),
                                   CallbackId cb_id);

ErrorCode askar_session_remove_all(SessionHandle handle,
                                   FfiStr category,
                                   FfiStr tag_filter,
                                   void (*cb)(CallbackId cb_id, ErrorCode err, int64_t removed),
                                   CallbackId cb_id);

ErrorCode askar_session_remove_key(SessionHandle handle,
                                   FfiStr name,
                                   void (*cb)(CallbackId cb_id, ErrorCode err),
                                   CallbackId cb_id);

ErrorCode askar_session_start(StoreHandle handle,
                              FfiStr profile,
                              int8_t as_transaction,
                              void (*cb)(CallbackId cb_id, ErrorCode err, SessionHandle handle),
                              CallbackId cb_id);

ErrorCode askar_session_update(SessionHandle handle,
                               int8_t operation,
                               FfiStr category,
                               FfiStr name,
                               struct ByteBuffer value,
                               FfiStr tags,
                               int64_t expiry_ms,
                               void (*cb)(CallbackId cb_id, ErrorCode err),
                               CallbackId cb_id);

ErrorCode askar_session_update_key(SessionHandle handle,
                                   FfiStr name,
                                   FfiStr metadata,
                                   FfiStr tags,
                                   int64_t expiry_ms,
                                   void (*cb)(CallbackId cb_id, ErrorCode err),
                                   CallbackId cb_id);

ErrorCode askar_set_custom_logger(const void *context,
                                  LogCallback log,
                                  struct Option_EnabledCallback enabled,
                                  struct Option_FlushCallback flush,
                                  int32_t max_level);

ErrorCode askar_set_default_logger(void);

ErrorCode askar_set_max_log_level(int32_t max_level);

ErrorCode askar_store_close(StoreHandle handle,
                            void (*cb)(CallbackId cb_id, ErrorCode err),
                            CallbackId cb_id);

ErrorCode askar_store_create_profile(StoreHandle handle,
                                     FfiStr profile,
                                     void (*cb)(CallbackId cb_id, ErrorCode err, const char *result_p),
                                     CallbackId cb_id);

ErrorCode askar_store_generate_raw_key(struct ByteBuffer seed, const char **out);

ErrorCode askar_store_get_profile_name(StoreHandle handle,
                                       void (*cb)(CallbackId cb_id, ErrorCode err, const char *name),
                                       CallbackId cb_id);

ErrorCode askar_store_open(FfiStr spec_uri,
                           FfiStr key_method,
                           FfiStr pass_key,
                           FfiStr profile,
                           void (*cb)(CallbackId cb_id, ErrorCode err, StoreHandle handle),
                           CallbackId cb_id);

ErrorCode askar_store_provision(FfiStr spec_uri,
                                FfiStr key_method,
                                FfiStr pass_key,
                                FfiStr profile,
                                int8_t recreate,
                                void (*cb)(CallbackId cb_id, ErrorCode err, StoreHandle handle),
                                CallbackId cb_id);

ErrorCode askar_store_rekey(StoreHandle handle,
                            FfiStr key_method,
                            FfiStr pass_key,
                            void (*cb)(CallbackId cb_id, ErrorCode err),
                            CallbackId cb_id);

ErrorCode askar_store_remove(FfiStr spec_uri,
                             void (*cb)(CallbackId cb_id, ErrorCode err, int8_t),
                             CallbackId cb_id);

ErrorCode askar_store_remove_profile(StoreHandle handle,
                                     FfiStr profile,
                                     void (*cb)(CallbackId cb_id, ErrorCode err, int8_t removed),
                                     CallbackId cb_id);

char *askar_version(void);

#ifdef __cplusplus
} // extern "C"
#endif // __cplusplus
