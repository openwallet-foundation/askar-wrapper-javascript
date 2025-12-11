import type {
  AeadParamsOptions,
  Argon2DerivePasswordOptions,
  Askar,
  AskarErrorObject,
  EncryptedBuffer,
  EntryListCountOptions,
  EntryListFreeOptions,
  EntryListGetCategoryOptions,
  EntryListGetNameOptions,
  EntryListGetTagsOptions,
  EntryListGetValueOptions,
  HandleListFreeOptions,
  KeyAeadDecryptOptions,
  KeyAeadEncryptOptions,
  KeyAeadGetPaddingOptions,
  KeyAeadGetParamsOptions,
  KeyAeadRandomNonceOptions,
  KeyConvertOptions,
  KeyCryptoBoxOpenOptions,
  KeyCryptoBoxOptions,
  KeyCryptoBoxSealOpenOptions,
  KeyCryptoBoxSealOptions,
  KeyDeriveEcdh1puOptions,
  KeyDeriveEcdhEsOptions,
  KeyEntryListCountOptions,
  KeyEntryListFreeOptions,
  KeyEntryListGetAlgorithmOptions,
  KeyEntryListGetMetadataOptions,
  KeyEntryListGetNameOptions,
  KeyEntryListGetTagsOptions,
  KeyEntryListLoadLocalOptions,
  KeyFreeOptions,
  KeyFromJwkOptions,
  KeyFromKeyExchangeOptions,
  KeyFromPublicBytesOptions,
  KeyFromSecretBytesOptions,
  KeyFromSeedOptions,
  KeyGenerateOptions,
  KeyGetAlgorithmOptions,
  KeyGetEphemeralOptions,
  KeyGetJwkPublicOptions,
  KeyGetJwkSecretOptions,
  KeyGetJwkThumbprintOptions,
  KeyGetPublicBytesOptions,
  KeyGetSecretBytesOptions,
  KeySignMessageOptions,
  KeyUnwrapKeyOptions,
  KeyVerifySignatureOptions,
  KeyWrapKeyOptions,
  MigrateIndySdkOptions,
  ScanFreeOptions,
  ScanNextOptions,
  ScanStartOptions,
  SessionCloseOptions,
  SessionCountOptions,
  SessionFetchAllKeysOptions,
  SessionFetchAllOptions,
  SessionFetchKeyOptions,
  SessionFetchOptions,
  SessionInsertKeyOptions,
  SessionRemoveAllOptions,
  SessionRemoveKeyOptions,
  SessionStartOptions,
  SessionUpdateKeyOptions,
  SessionUpdateOptions,
  SetCustomLoggerOptions,
  SetMaxLogLevelOptions,
  StoreCloseOptions,
  StoreCopyProfileOptions,
  StoreCopyToOptions,
  StoreCreateProfileOptions,
  StoreGenerateRawKeyOptions,
  StoreGetDefaultProfileOptions,
  StoreGetProfileNameOptions,
  StoreListProfilesOptions,
  StoreListScansOptions,
  StoreListSessionsOptions,
  StoreOpenOptions,
  StoreProvisionOptions,
  StoreRekeyOptions,
  StoreRemoveOptions,
  StoreRemoveProfileOptions,
  StoreRenameProfileOptions,
  StoreSetDefaultProfileOptions,
} from '@openwallet-foundation/askar-shared'
import {
  AeadParams,
  AskarError,
  EntryListHandle,
  handleInvalidNullResponse,
  KeyEntryListHandle,
  LocalKeyHandle,
  ScanHandle,
  SessionHandle,
  StoreHandle,
} from '@openwallet-foundation/askar-shared'
import {
  allocateAeadParams,
  allocateEncryptedBuffer,
  allocateInt8Buffer,
  allocateInt32Buffer,
  allocatePointer,
  allocateSecretBuffer,
  allocateStringBuffer,
  allocateStringListHandle,
  type ByteBufferType,
  deallocateCallbackBuffer,
  decodeHandleList,
  type EncryptedBufferType,
  encryptedBufferStructToClass,
  FFI_ENTRY_LIST_HANDLE,
  FFI_INT8,
  FFI_INT64,
  FFI_KEY_ENTRY_LIST_HANDLE,
  FFI_SCAN_HANDLE,
  FFI_SESSION_HANDLE,
  FFI_STORE_HANDLE,
  FFI_STRING,
  FFI_STRING_LIST_HANDLE,
  type NativeCallback,
  type NativeCallbackWithResponse,
  type NodeJsHandleList,
  secretBufferToUint8Array,
  serializeArguments,
  toNativeCallback,
  toNativeCallbackWithResponse,
  toNativeLogCallback,
} from './ffi'
import { getNativeAskar } from './library'

// With koffi, output parameters are arrays that get filled in place
// biome-ignore lint/suspicious/noExplicitAny: koffi output parameters
function handleNullableReturnPointer<Return>(returnValue: [any]): Return | null {
  const value = returnValue[0]
  if (value === null || value === undefined) return null
  return value as Return
}

// biome-ignore lint/suspicious/noExplicitAny: koffi output parameters
function handleReturnPointer<Return>(returnValue: [any]): Return {
  const value = returnValue[0]
  if (value === null || value === undefined) {
    throw AskarError.customError({ message: 'Unexpected null pointer' })
  }

  return value as Return
}

export class NodeJSAskar implements Askar {
  // biome-ignore lint/suspicious/noExplicitAny: koffi callback type
  private promisify = async (method: (nativeCallbackPtr: any, id: number) => number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cb: NativeCallback = (id, errorCode) => {
        deallocateCallbackBuffer(id)

        try {
          this.handleError(errorCode)
        } catch (e) {
          reject(e)
        }

        resolve()
      }
      const { nativeCallback, id } = toNativeCallback(cb)
      method(nativeCallback, +id)
    })
  }

  private promisifyWithResponse = async <Return, Response = string>(
    // biome-ignore lint/suspicious/noExplicitAny: koffi callback type
    method: (nativeCallbackWithResponsePtr: any, id: number) => number,
    responseFfiType = FFI_STRING
  ): Promise<Return | null> => {
    return new Promise((resolve, reject) => {
      const cb: NativeCallbackWithResponse<Response> = (id, errorCode, response) => {
        deallocateCallbackBuffer(id)

        if (errorCode !== 0) {
          const error = this.getAskarError(errorCode)
          reject(error)
        }

        if (typeof response === 'string') {
          if (responseFfiType === FFI_STRING) resolve(response as unknown as Return)
          try {
            resolve(JSON.parse(response) as Return)
          } catch (error) {
            reject(error)
          }
        } else if (typeof response === 'number') {
          resolve(response as unknown as Return)
        } else if (response === null || response === undefined) {
          resolve(null)
        } else {
          // For other types, try to use directly
          resolve(response as unknown as Return)
        }

        reject(AskarError.customError({ message: `could not parse return type properly (type: ${typeof response})` }))
      }
      const { nativeCallback, id } = toNativeCallbackWithResponse(cb, responseFfiType)
      const errorCode = method(nativeCallback, +id)
      if (errorCode !== 0) deallocateCallbackBuffer(+id)

      this.handleError(errorCode)
    })
  }

  /**
   * Fetch the error from the native library and throw it as a JS error
   *
   * NOTE:
   * Checks whether the error code of the returned error matches the error code that was passed to the function.
   * If it doesn't, we throw an error with the original errorCode, and a custom message explaining we weren't able
   * to retrieve the error message from the native library. This should however not break functionality as long as
   * error codes are used rather than error messages for error handling.
   *
   */
  private getAskarError(errorCode: number): AskarError {
    const error = this.getCurrentError()
    if (error.code !== errorCode) {
      return new AskarError({
        code: errorCode,
        message:
          'Error details have already been overwritten on the native side, unable to retrieve error message for the error',
      })
    }

    return new AskarError(error)
  }

  private handleError(errorCode: number) {
    if (errorCode === 0) return

    throw this.getAskarError(errorCode)
  }

  public get nativeAskar() {
    return getNativeAskar()
  }

  public version(): string {
    return this.nativeAskar.askar_version()
  }

  public getCurrentError(): AskarErrorObject {
    const error = allocateStringBuffer()
    this.nativeAskar.askar_get_current_error(error)
    const serializedError = handleReturnPointer<string>(error)

    return JSON.parse(serializedError) as AskarErrorObject
  }

  public clearCustomLogger(): void {
    this.nativeAskar.askar_clear_custom_logger()
  }

  // TODO: the id has to be deallocated when its done, but how?
  public setCustomLogger({ logLevel, flush = false, enabled = false, logger }: SetCustomLoggerOptions): void {
    const { id, nativeCallback } = toNativeLogCallback(logger)

    // TODO: flush and enabled are just guessed
    const errorCode = this.nativeAskar.askar_set_custom_logger(0, nativeCallback, +enabled, +flush, logLevel)
    this.handleError(errorCode)
    deallocateCallbackBuffer(+id)
  }

  public setDefaultLogger(): void {
    const errorCode = this.nativeAskar.askar_set_default_logger()
    this.handleError(errorCode)
  }

  public setMaxLogLevel(options: SetMaxLogLevelOptions): void {
    const { logLevel } = serializeArguments(options)

    const errorCode = this.nativeAskar.askar_set_max_log_level(logLevel)
    this.handleError(errorCode)
  }

  public argon2DerivePassword(options: Argon2DerivePasswordOptions) {
    const { parameters, password, salt } = serializeArguments(options)

    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_argon2_derive_password(
      parameters,
      password,
      salt,
      // NOTE: we should not serialize the config, it should be passed as struct
      options.config ?? null,
      ret
    )

    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public entryListCount(options: EntryListCountOptions): number {
    const { entryListHandle } = serializeArguments(options)
    const ret = allocateInt32Buffer()

    const errorCode = this.nativeAskar.askar_entry_list_count(entryListHandle, ret)
    this.handleError(errorCode)

    return handleReturnPointer<number>(ret)
  }

  public entryListFree(options: EntryListFreeOptions): void {
    const { entryListHandle } = serializeArguments(options)

    this.nativeAskar.askar_entry_list_free(entryListHandle)
  }

  public entryListGetCategory(options: EntryListGetCategoryOptions): string {
    const { entryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_entry_list_get_category(entryListHandle, index, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public entryListGetName(options: EntryListGetNameOptions): string {
    const { entryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_entry_list_get_name(entryListHandle, index, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public entryListGetTags(options: EntryListGetTagsOptions): string | null {
    const { entryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_entry_list_get_tags(entryListHandle, index, ret)
    this.handleError(errorCode)

    return handleNullableReturnPointer<string>(ret)
  }

  public entryListGetValue(options: EntryListGetValueOptions): Uint8Array {
    const { entryListHandle, index } = serializeArguments(options)

    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_entry_list_get_value(entryListHandle, index, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public handleListFree(options: HandleListFreeOptions): void {
    this.nativeAskar.askar_handle_list_free(options.handleList)
  }

  public keyAeadDecrypt(options: KeyAeadDecryptOptions): Uint8Array {
    const { ciphertext, localKeyHandle, nonce, aad, tag } = serializeArguments({
      localKeyHandle: options.localKeyHandle,
      nonce: options.nonce,
      ciphertext: options.ciphertext,
      tag: options.tag ?? new Uint8Array(0),
      aad: options.aad ?? new Uint8Array(0),
    })
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_aead_decrypt(localKeyHandle, ciphertext, nonce, tag, aad, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyAeadEncrypt(options: KeyAeadEncryptOptions): EncryptedBuffer {
    const { localKeyHandle, message, nonce, aad } = serializeArguments({
      localKeyHandle: options.localKeyHandle,
      message: options.message,
      nonce: options.nonce ?? new Uint8Array(0),
      aad: options.aad ?? new Uint8Array(0),
    })
    const ret = allocateEncryptedBuffer()

    const errorCode = this.nativeAskar.askar_key_aead_encrypt(localKeyHandle, message, nonce, aad, ret)
    this.handleError(errorCode)
    const encryptedBuffer = handleReturnPointer<EncryptedBufferType>(ret)
    const encryptedBufferClass = encryptedBufferStructToClass(encryptedBuffer)
    this.nativeAskar.askar_buffer_free(encryptedBuffer.secretBuffer)

    return encryptedBufferClass
  }

  public keyAeadGetPadding(options: KeyAeadGetPaddingOptions): number {
    const { localKeyHandle, msgLen } = serializeArguments(options)
    const ret = allocateInt32Buffer()

    const errorCode = this.nativeAskar.askar_key_aead_get_padding(localKeyHandle, msgLen, ret)
    this.handleError(errorCode)

    return handleReturnPointer<number>(ret)
  }

  public keyAeadGetParams(options: KeyAeadGetParamsOptions): AeadParams {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateAeadParams()

    const errorCode = this.nativeAskar.askar_key_aead_get_params(localKeyHandle, ret)
    this.handleError(errorCode)

    return new AeadParams(handleReturnPointer<AeadParamsOptions>(ret))
  }

  public keyAeadRandomNonce(options: KeyAeadRandomNonceOptions): Uint8Array {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_aead_random_nonce(localKeyHandle, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyConvert(options: KeyConvertOptions): LocalKeyHandle {
    const { localKeyHandle, algorithm } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_convert(localKeyHandle, algorithm, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyCryptoBox(options: KeyCryptoBoxOptions): Uint8Array {
    const { nonce, message, recipientKey, senderKey } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_crypto_box(recipientKey, senderKey, message, nonce, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyCryptoBoxOpen(options: KeyCryptoBoxOpenOptions): Uint8Array {
    const { nonce, message, senderKey, recipientKey } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_crypto_box_open(recipientKey, senderKey, message, nonce, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyCryptoBoxRandomNonce(): Uint8Array {
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_crypto_box_random_nonce(ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyCryptoBoxSeal(options: KeyCryptoBoxSealOptions): Uint8Array {
    const { message, localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_crypto_box_seal(localKeyHandle, message, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyCryptoBoxSealOpen(options: KeyCryptoBoxSealOpenOptions): Uint8Array {
    const { ciphertext, localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_crypto_box_seal_open(localKeyHandle, ciphertext, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyDeriveEcdh1pu(options: KeyDeriveEcdh1puOptions): LocalKeyHandle {
    const { senderKey, recipientKey, algorithm, algId, apu, apv, ephemeralKey, receive, ccTag } = serializeArguments({
      senderKey: options.senderKey,
      recipientKey: options.recipientKey,
      algorithm: options.algorithm,
      algId: options.algId,
      apu: options.apu,
      apv: options.apv,
      ephemeralKey: options.ephemeralKey,
      receive: options.receive,
      ccTag: options.ccTag ?? new Uint8Array(0),
    })

    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_derive_ecdh_1pu(
      algorithm,
      ephemeralKey,
      senderKey,
      recipientKey,
      algId,
      apu,
      apv,
      ccTag,
      receive,
      ret
    )
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyDeriveEcdhEs(options: KeyDeriveEcdhEsOptions): LocalKeyHandle {
    const { receive, apv, apu, algId, recipientKey, ephemeralKey, algorithm } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_derive_ecdh_es(
      algorithm,
      ephemeralKey,
      recipientKey,
      algId,
      apu,
      apv,
      receive,
      ret
    )
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyEntryListCount(options: KeyEntryListCountOptions): number {
    const { keyEntryListHandle } = serializeArguments(options)
    const ret = allocateInt32Buffer()

    const errorCode = this.nativeAskar.askar_key_entry_list_count(keyEntryListHandle, ret)
    this.handleError(errorCode)

    return handleReturnPointer<number>(ret)
  }

  public keyEntryListFree(options: KeyEntryListFreeOptions): void {
    const { keyEntryListHandle } = serializeArguments(options)

    this.nativeAskar.askar_key_entry_list_free(keyEntryListHandle)
  }

  public keyEntryListGetAlgorithm(options: KeyEntryListGetAlgorithmOptions): string {
    const { keyEntryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_entry_list_get_algorithm(keyEntryListHandle, index, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public keyEntryListGetMetadata(options: KeyEntryListGetMetadataOptions): string | null {
    const { keyEntryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_entry_list_get_metadata(keyEntryListHandle, index, ret)
    this.handleError(errorCode)

    return handleNullableReturnPointer<string>(ret)
  }

  public keyEntryListGetName(options: KeyEntryListGetNameOptions): string {
    const { keyEntryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_entry_list_get_name(keyEntryListHandle, index, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public keyEntryListGetTags(options: KeyEntryListGetTagsOptions): string | null {
    const { keyEntryListHandle, index } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_entry_list_get_tags(keyEntryListHandle, index, ret)
    this.handleError(errorCode)

    return handleNullableReturnPointer<string>(ret)
  }

  public keyEntryListLoadLocal(options: KeyEntryListLoadLocalOptions): LocalKeyHandle {
    const { index, keyEntryListHandle } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_entry_list_load_local(keyEntryListHandle, index, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyFree(options: KeyFreeOptions): void {
    const { localKeyHandle } = serializeArguments(options)

    this.nativeAskar.askar_key_free(localKeyHandle)
  }

  public keyFromJwk(options: KeyFromJwkOptions): LocalKeyHandle {
    const { jwk } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_from_jwk(jwk, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyFromKeyExchange(options: KeyFromKeyExchangeOptions): LocalKeyHandle {
    const { algorithm, pkHandle, skHandle } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_from_key_exchange(algorithm, skHandle, pkHandle, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyFromPublicBytes(options: KeyFromPublicBytesOptions): LocalKeyHandle {
    const { publicKey, algorithm } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_from_public_bytes(algorithm, publicKey, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyFromSecretBytes(options: KeyFromSecretBytesOptions): LocalKeyHandle {
    const { secretKey, algorithm } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_from_secret_bytes(algorithm, secretKey, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyFromSeed(options: KeyFromSeedOptions): LocalKeyHandle {
    const { algorithm, method, seed } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_from_seed(algorithm, seed, method, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyGenerate(options: KeyGenerateOptions): LocalKeyHandle {
    const { algorithm, ephemeral, keyBackend } = serializeArguments(options)
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_generate(algorithm, keyBackend, ephemeral, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyGetAlgorithm(options: KeyGetAlgorithmOptions): string {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_get_algorithm(localKeyHandle, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public keyGetEphemeral(options: KeyGetEphemeralOptions): number {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateInt32Buffer()

    const errorCode = this.nativeAskar.askar_key_get_ephemeral(localKeyHandle, ret)
    this.handleError(errorCode)

    return handleReturnPointer<number>(ret)
  }

  public keyGetJwkPublic(options: KeyGetJwkPublicOptions): string {
    const { localKeyHandle, algorithm } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_get_jwk_public(localKeyHandle, algorithm, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public keyGetJwkSecret(options: KeyGetJwkSecretOptions): Uint8Array {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_get_jwk_secret(localKeyHandle, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyGetJwkThumbprint(options: KeyGetJwkThumbprintOptions): string {
    const { localKeyHandle, algorithm } = serializeArguments(options)
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_key_get_jwk_thumbprint(localKeyHandle, algorithm, ret)
    this.handleError(errorCode)

    return handleReturnPointer<string>(ret)
  }

  public keyGetPublicBytes(options: KeyGetPublicBytesOptions): Uint8Array {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_get_public_bytes(localKeyHandle, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyGetSecretBytes(options: KeyGetSecretBytesOptions): Uint8Array {
    const { localKeyHandle } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_get_secret_bytes(localKeyHandle, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keySignMessage(options: KeySignMessageOptions): Uint8Array {
    const { localKeyHandle, message, sigType } = serializeArguments(options)
    const ret = allocateSecretBuffer()

    const errorCode = this.nativeAskar.askar_key_sign_message(localKeyHandle, message, sigType, ret)
    this.handleError(errorCode)
    const byteBuffer = handleReturnPointer<ByteBufferType>(ret)
    const uint8Array = secretBufferToUint8Array(byteBuffer)
    this.nativeAskar.askar_buffer_free(byteBuffer)

    return uint8Array
  }

  public keyUnwrapKey(options: KeyUnwrapKeyOptions): LocalKeyHandle {
    const { localKeyHandle, algorithm, ciphertext, nonce, tag } = serializeArguments({
      localKeyHandle: options.localKeyHandle,
      algorithm: options.algorithm,
      ciphertext: options.ciphertext,
      nonce: options.nonce ?? new Uint8Array(0),
      tag: options.tag ?? new Uint8Array(0),
    })
    const ret = allocatePointer()

    const errorCode = this.nativeAskar.askar_key_unwrap_key(localKeyHandle, algorithm, ciphertext, nonce, tag, ret)
    this.handleError(errorCode)

    const handle = handleReturnPointer<Uint8Array>(ret)
    return new LocalKeyHandle(handle)
  }

  public keyVerifySignature(options: KeyVerifySignatureOptions): boolean {
    const { localKeyHandle, sigType, message, signature } = serializeArguments(options)
    const ret = allocateInt8Buffer()

    const errorCode = this.nativeAskar.askar_key_verify_signature(localKeyHandle, message, signature, sigType, ret)
    this.handleError(errorCode)

    return Boolean(handleReturnPointer<number>(ret))
  }

  public keyWrapKey(options: KeyWrapKeyOptions): EncryptedBuffer {
    const { localKeyHandle, nonce, other } = serializeArguments({
      ...options,
      nonce: options.nonce ?? new Uint8Array(0),
    })
    const ret = allocateEncryptedBuffer()

    const errorCode = this.nativeAskar.askar_key_wrap_key(localKeyHandle, other, nonce, ret)
    this.handleError(errorCode)
    const encryptedBuffer = handleReturnPointer<EncryptedBufferType>(ret)
    const encryptedBufferClass = encryptedBufferStructToClass(encryptedBuffer)
    this.nativeAskar.askar_buffer_free(encryptedBuffer.secretBuffer)

    return encryptedBufferClass
  }

  public keyGetSupportedBackends(): string[] {
    const stringListHandlePtr = allocateStringListHandle()

    const keyGetSupportedBackendsErrorCode = this.nativeAskar.askar_key_get_supported_backends(stringListHandlePtr)
    this.handleError(keyGetSupportedBackendsErrorCode)
    const stringListHandle = stringListHandlePtr[0]

    const listCountPtr = allocateInt32Buffer()
    const stringListCountErrorCode = this.nativeAskar.askar_string_list_count(stringListHandle, listCountPtr)
    this.handleError(stringListCountErrorCode)
    const count = listCountPtr[0]

    const supportedBackends = []

    for (let i = 0; i < count; i++) {
      const strPtr = allocateStringBuffer()
      const errorCode = this.nativeAskar.askar_string_list_get_item(stringListHandle, i, strPtr)
      this.handleError(errorCode)
      supportedBackends.push(strPtr[0] as string)
    }
    this.nativeAskar.askar_string_list_free(stringListHandle)

    return supportedBackends
  }

  public scanFree(options: ScanFreeOptions): void {
    const { scanHandle } = serializeArguments(options)

    const errorCode = this.nativeAskar.askar_scan_free(scanHandle)
    this.handleError(errorCode)
  }

  public async scanNext(options: ScanNextOptions): Promise<EntryListHandle | null> {
    const { scanHandle } = serializeArguments(options)

    const handle = await this.promisifyWithResponse<Uint8Array>(
      (cb, cbId) => this.nativeAskar.askar_scan_next(scanHandle, cb, cbId),
      FFI_ENTRY_LIST_HANDLE
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async scanStart(options: ScanStartOptions): Promise<ScanHandle> {
    const { category, limit, offset, profile, storeHandle, tagFilter, orderBy, descending } = serializeArguments({
      ...options,
      offset: options.offset ?? 0,
      limit: options.limit ?? -1,
      descending: options.descending ?? 0,
    })

    const handle = await this.promisifyWithResponse<number>(
      (cb, cbId) =>
        this.nativeAskar.askar_scan_start(
          storeHandle,
          profile,
          category,
          tagFilter,
          offset,
          limit,
          orderBy,
          descending,
          cb,
          cbId
        ),
      FFI_SCAN_HANDLE
    )

    return ScanHandle.fromHandle(handle)
  }

  public async sessionClose(options: SessionCloseOptions): Promise<void> {
    const { commit, sessionHandle } = serializeArguments(options)

    return await this.promisify((cb, cbId) => this.nativeAskar.askar_session_close(sessionHandle, commit, cb, cbId))
  }

  public async sessionCount(options: SessionCountOptions): Promise<number> {
    const { sessionHandle, tagFilter, category } = serializeArguments(options)
    const response = await this.promisifyWithResponse<number, number>(
      (cb, cbId) => this.nativeAskar.askar_session_count(sessionHandle, category, tagFilter, cb, cbId),
      FFI_INT64
    )

    return handleInvalidNullResponse(response)
  }

  public async sessionFetch(options: SessionFetchOptions): Promise<EntryListHandle | null> {
    const { name, category, sessionHandle, forUpdate } = serializeArguments(options)
    const handle = await this.promisifyWithResponse<Uint8Array>(
      (cb, cbId) => this.nativeAskar.askar_session_fetch(sessionHandle, category, name, forUpdate, cb, cbId),
      FFI_ENTRY_LIST_HANDLE
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async sessionFetchAll(options: SessionFetchAllOptions): Promise<EntryListHandle | null> {
    const { forUpdate, sessionHandle, tagFilter, limit, category, orderBy, descending } = serializeArguments({
      ...options,
      limit: options.limit ?? -1,
      descending: options.descending ?? 0,
    })

    const handle = await this.promisifyWithResponse<Uint8Array>(
      (cb, cbId) =>
        this.nativeAskar.askar_session_fetch_all(
          sessionHandle,
          category,
          tagFilter,
          limit,
          orderBy,
          descending,
          forUpdate,
          cb,
          cbId
        ),
      FFI_ENTRY_LIST_HANDLE
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async sessionFetchAllKeys(options: SessionFetchAllKeysOptions): Promise<KeyEntryListHandle | null> {
    const { forUpdate, limit, tagFilter, sessionHandle, algorithm, thumbprint } = serializeArguments({
      ...options,
      limit: options.limit ?? -1,
    })

    const handle = await this.promisifyWithResponse<Uint8Array>(
      (cb, cbId) =>
        this.nativeAskar.askar_session_fetch_all_keys(
          sessionHandle,
          algorithm,
          thumbprint,
          tagFilter,
          limit,
          forUpdate,
          cb,
          cbId
        ),
      FFI_KEY_ENTRY_LIST_HANDLE
    )

    return KeyEntryListHandle.fromHandle(handle)
  }

  public async sessionFetchKey(options: SessionFetchKeyOptions): Promise<KeyEntryListHandle | null> {
    const { forUpdate, sessionHandle, name } = serializeArguments(options)

    const handle = await this.promisifyWithResponse<Uint8Array>(
      (cb, cbId) => this.nativeAskar.askar_session_fetch_key(sessionHandle, name, forUpdate, cb, cbId),
      FFI_KEY_ENTRY_LIST_HANDLE
    )

    return KeyEntryListHandle.fromHandle(handle)
  }

  public async sessionInsertKey(options: SessionInsertKeyOptions): Promise<void> {
    const { name, sessionHandle, expiryMs, localKeyHandle, metadata, tags } = serializeArguments({
      ...options,
      expiryMs: options.expiryMs ?? -1,
    })

    return this.promisify((cb, cbId) =>
      this.nativeAskar.askar_session_insert_key(sessionHandle, localKeyHandle, name, metadata, tags, expiryMs, cb, cbId)
    )
  }

  public async sessionRemoveAll(options: SessionRemoveAllOptions): Promise<number> {
    const { sessionHandle, tagFilter, category } = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_session_remove_all(sessionHandle, category, tagFilter, cb, cbId),
      FFI_INT64
    )

    return handleInvalidNullResponse(response)
  }

  public async sessionRemoveKey(options: SessionRemoveKeyOptions): Promise<void> {
    const { sessionHandle, name } = serializeArguments(options)

    return this.promisify((cb, cbId) => this.nativeAskar.askar_session_remove_key(sessionHandle, name, cb, cbId))
  }

  public async sessionStart(options: SessionStartOptions): Promise<SessionHandle> {
    const { storeHandle, profile, asTransaction } = serializeArguments(options)

    const handle = await this.promisifyWithResponse<number, number>(
      (cb, cbId) => this.nativeAskar.askar_session_start(storeHandle, profile, asTransaction, cb, cbId),
      FFI_SESSION_HANDLE
    )

    return SessionHandle.fromHandle(handle)
  }

  public async sessionUpdate(options: SessionUpdateOptions): Promise<void> {
    const { name, sessionHandle, category, expiryMs, tags, operation, value } = serializeArguments({
      ...options,
      expiryMs: options.expiryMs ?? -1,
      value: options.value ?? new Uint8Array(0),
    })

    return this.promisify((cb, cbId) =>
      this.nativeAskar.askar_session_update(sessionHandle, operation, category, name, value, tags, expiryMs, cb, cbId)
    )
  }

  public async sessionUpdateKey(options: SessionUpdateKeyOptions): Promise<void> {
    const { expiryMs, tags, name, sessionHandle, metadata } = serializeArguments({
      ...options,
      expiryMs: options.expiryMs ?? -1,
    })

    return this.promisify((cb, cbId) =>
      this.nativeAskar.askar_session_update_key(sessionHandle, name, metadata, tags, expiryMs, cb, cbId)
    )
  }

  public storeClose(options: StoreCloseOptions): Promise<void> {
    const { storeHandle } = serializeArguments(options)

    return this.promisify((cb, cbId) => this.nativeAskar.askar_store_close(storeHandle, cb, cbId))
  }

  public storeCopyTo(options: StoreCopyToOptions): Promise<void> {
    const { storeHandle, targetUri, passKey, keyMethod, recreate } = serializeArguments({
      ...options,
      recreate: options.recreate ?? 0,
    })

    return this.promisify((cb, cbId) =>
      this.nativeAskar.askar_store_copy(storeHandle, targetUri, keyMethod, passKey, recreate, cb, cbId)
    )
  }

  public async storeCreateProfile(options: StoreCreateProfileOptions): Promise<string> {
    const { storeHandle, profile } = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>(
      (cb, cbId) => this.nativeAskar.askar_store_create_profile(storeHandle, profile, cb, cbId),
      FFI_STRING
    )

    return handleInvalidNullResponse(response)
  }

  public storeGenerateRawKey(options: StoreGenerateRawKeyOptions): string {
    const { seed } = serializeArguments({
      ...options,
      seed: options.seed ?? new Uint8Array(0),
    })
    const ret = allocateStringBuffer()

    const errorCode = this.nativeAskar.askar_store_generate_raw_key(seed, ret)
    this.handleError(errorCode)

    return ret[0] as string
  }

  public async storeGetDefaultProfile(options: StoreGetDefaultProfileOptions): Promise<string> {
    const { storeHandle } = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>((cb, cbId) =>
      this.nativeAskar.askar_store_get_default_profile(storeHandle, cb, cbId)
    )

    return handleInvalidNullResponse(response)
  }

  public async storeGetProfileName(options: StoreGetProfileNameOptions): Promise<string> {
    const { storeHandle } = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>((cb, cbId) =>
      this.nativeAskar.askar_store_get_profile_name(storeHandle, cb, cbId)
    )

    return handleInvalidNullResponse(response)
  }

  public async storeListProfiles(options: StoreListProfilesOptions): Promise<string[]> {
    const { storeHandle } = serializeArguments(options)
    // biome-ignore lint/suspicious/noExplicitAny: koffi handle type
    const listHandle = await this.promisifyWithResponse<any>(
      (cb, cbId) => this.nativeAskar.askar_store_list_profiles(storeHandle, cb, cbId),
      FFI_STRING_LIST_HANDLE
    )
    if (listHandle === null) {
      throw AskarError.customError({ message: 'Invalid handle' })
    }
    const counti32 = allocateInt32Buffer()
    const errorCode = this.nativeAskar.askar_string_list_count(listHandle, counti32)
    this.handleError(errorCode)
    const count = counti32[0]
    const ret = []
    const strval = allocateStringBuffer()
    for (let i = 0; i < count; i++) {
      const errorCode = this.nativeAskar.askar_string_list_get_item(listHandle, i, strval)
      this.handleError(errorCode)
      ret.push(strval[0] as string)
    }
    this.nativeAskar.askar_string_list_free(listHandle)
    return ret
  }

  public async storeListScans(options: StoreListScansOptions): Promise<ScanHandle[]> {
    const { storeHandle } = serializeArguments(options)
    const handleList = await this.promisifyWithResponse<NodeJsHandleList>(
      (cb, cbId) => this.nativeAskar.askar_store_list_scans(storeHandle, cb, cbId),
      'FfiHandleList'
    )
    if (!handleList) return []

    const scanHandleList = decodeHandleList(handleList).map((scanHandle) => ScanHandle.fromHandle(scanHandle))
    this.handleListFree({ handleList })

    return scanHandleList
  }

  public async storeListSessions(options: StoreListSessionsOptions): Promise<SessionHandle[]> {
    const { storeHandle } = serializeArguments(options)
    const handleList = await this.promisifyWithResponse<NodeJsHandleList>(
      (cb, cbId) => this.nativeAskar.askar_store_list_sessions(storeHandle, cb, cbId),
      'FfiHandleList'
    )

    if (!handleList) return []

    const sessionHandleList = decodeHandleList(handleList).map((sessionHandle) =>
      SessionHandle.fromHandle(sessionHandle)
    )
    this.handleListFree({ handleList })

    return sessionHandleList
  }

  public async storeOpen(options: StoreOpenOptions): Promise<StoreHandle> {
    const { profile, keyMethod, passKey, specUri } = serializeArguments(options)

    const handle = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_store_open(specUri, keyMethod, passKey, profile, cb, cbId),
      FFI_STORE_HANDLE
    )

    return StoreHandle.fromHandle(handle)
  }

  public async storeProvision(options: StoreProvisionOptions): Promise<StoreHandle> {
    const { profile, passKey, keyMethod, specUri, recreate } = serializeArguments(options)

    const handle = await this.promisifyWithResponse<number, number>(
      (cb, cbId) => this.nativeAskar.askar_store_provision(specUri, keyMethod, passKey, profile, recreate, cb, cbId),
      FFI_STORE_HANDLE
    )

    return StoreHandle.fromHandle(handle)
  }

  public async storeRekey(options: StoreRekeyOptions): Promise<void> {
    const { passKey, keyMethod, storeHandle } = serializeArguments(options)

    return this.promisify((cb, cbId) => this.nativeAskar.askar_store_rekey(storeHandle, keyMethod, passKey, cb, cbId))
  }

  public async storeRemove(options: StoreRemoveOptions): Promise<number> {
    const { specUri } = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_store_remove(specUri, cb, cbId),
      FFI_INT8
    )

    return handleInvalidNullResponse(response)
  }

  public async storeRemoveProfile(options: StoreRemoveProfileOptions): Promise<number> {
    const { storeHandle, profile } = serializeArguments(options)

    const response = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_store_remove_profile(storeHandle, profile, cb, cbId),
      FFI_INT8
    )

    return handleInvalidNullResponse(response)
  }

  public async storeSetDefaultProfile(options: StoreSetDefaultProfileOptions): Promise<void> {
    const { storeHandle, profile } = serializeArguments(options)

    return this.promisify((cb, cbId) =>
      this.nativeAskar.askar_store_set_default_profile(storeHandle, profile, cb, cbId)
    )
  }

  public async storeRenameProfile(options: StoreRenameProfileOptions): Promise<number> {
    const { storeHandle, fromProfile, toProfile } = serializeArguments(options)

    const response = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_store_rename_profile(storeHandle, fromProfile, toProfile, cb, cbId),
      FFI_INT8
    )

    return handleInvalidNullResponse(response)
  }

  public async storeCopyProfile(options: StoreCopyProfileOptions): Promise<number> {
    const { fromHandle, toHandle, fromProfile, toProfile } = serializeArguments(options)

    const response = await this.promisifyWithResponse<number>(
      (cb, cbId) => this.nativeAskar.askar_store_copy_profile(fromHandle, toHandle, fromProfile, toProfile, cb, cbId),
      FFI_INT8
    )

    return handleInvalidNullResponse(response)
  }

  public async migrateIndySdk(options: MigrateIndySdkOptions): Promise<void> {
    const { specUri, kdfLevel, walletKey, walletName } = serializeArguments(options)
    await this.promisify((cb, cbId) =>
      this.nativeAskar.askar_migrate_indy_sdk(specUri, walletName, walletKey, kdfLevel, cb, cbId)
    )
  }
}
