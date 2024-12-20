import type { NativeBindings } from './NativeBindings'
import type { Callback, CallbackWithResponse, ReturnObject } from './serialize'
import type {
  Askar,
  AskarErrorObject,
  EntryListCountOptions,
  EntryListFreeOptions,
  EntryListGetCategoryOptions,
  EntryListGetNameOptions,
  EntryListGetTagsOptions,
  EntryListGetValueOptions,
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
  StoreCloseOptions,
  StoreCopyToOptions,
  StoreCreateProfileOptions,
  StoreGenerateRawKeyOptions,
  StoreGetDefaultProfileOptions,
  StoreGetProfileNameOptions,
  StoreListProfilesOptions,
  StoreOpenOptions,
  StoreProvisionOptions,
  StoreRekeyOptions,
  StoreRemoveOptions,
  StoreRemoveProfileOptions,
  StoreSetDefaultProfileOptions,
} from '@owf/askar-shared'
import {
  AskarError,
  handleInvalidNullResponse,
  AeadParams,
  EncryptedBuffer,
  LocalKeyHandle,
  EntryListHandle,
  StoreHandle,
  SessionHandle,
  ScanHandle,
  KeyEntryListHandle,
} from '@owf/askar-shared'
import { serializeArguments } from './serialize'

export class ReactNativeAskar implements Askar {
  private askar: NativeBindings

  public constructor(bindings: NativeBindings) {
    this.askar = bindings
  }

  /**
   * Fetch the error from the native library and return it as a JS error
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

  private handleError<T>({ errorCode, value }: ReturnObject<T>): T {
    if (errorCode === 0) return value as T
    throw this.getAskarError(errorCode)
  }

  private promisify(method: (cb: Callback) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const _cb: Callback = ({ errorCode }) => {
        try {
          this.handleError({ errorCode })
          resolve()
        } catch (e) {
          reject(e)
        }
      }

      method(_cb)
    })
  }

  private promisifyWithResponse<Return>(method: (cb: CallbackWithResponse<Return>) => void): Promise<Return | null> {
    return new Promise((resolve, reject) => {
      const _cb: CallbackWithResponse<Return> = ({ errorCode, value }) => {
        if (errorCode !== 0) {
          const error = this.getAskarError(errorCode)
          reject(error)
        } else {
          if (value === undefined) {
            reject(
              AskarError.customError({ message: 'error code was 0 but no value found. This should not occur.' }),
            )
          } else {
            resolve(value)
          }
        }
      }
      method(_cb)
    })
  }

  public version(): string {
    return handleInvalidNullResponse(this.askar.version({}))
  }

  public getCurrentError(): AskarErrorObject {
    const serializedError = handleInvalidNullResponse(this.askar.getCurrentError({}))
    return JSON.parse(serializedError) as AskarErrorObject
  }

  public clearCustomLogger(): void {
    throw new Error('Method not implemented. clearCustomLogger')
  }

  public setCustomLogger(): void {
    throw new Error('Method not implemented. setCustomLogger')
  }

  public setDefaultLogger(): void {
    this.askar.setDefaultLogger({})
  }

  public setMaxLogLevel(): void {
    throw new Error('Method not implemented. setMaxLogLevel')
  }

  public entryListCount(options: EntryListCountOptions): number {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.entryListCount(serializedOptions)))
  }

  public entryListFree(options: EntryListFreeOptions): void {
    const serializedOptions = serializeArguments(options)

    // null response is expected as we're freeing the object
    this.handleError(this.askar.entryListFree(serializedOptions))
  }

  public entryListGetCategory(options: EntryListGetCategoryOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.entryListGetCategory(serializedOptions)))
  }

  public entryListGetName(options: EntryListGetNameOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.entryListGetName(serializedOptions)))
  }

  public entryListGetTags(options: EntryListGetTagsOptions): string | null {
    const serializedOptions = serializeArguments(options)
    return this.handleError(this.askar.entryListGetTags(serializedOptions))
  }

  public entryListGetValue(options: EntryListGetValueOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.entryListGetValue(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyAeadDecrypt(options: KeyAeadDecryptOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyAeadDecrypt(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyAeadEncrypt(options: KeyAeadEncryptOptions): EncryptedBuffer {
    const serializedOptions = serializeArguments(options)
    const ret = this.handleError(this.askar.keyAeadEncrypt(serializedOptions))

    const { buffer, noncePos, tagPos } = handleInvalidNullResponse(ret)

    return new EncryptedBuffer({ tagPos, noncePos, buffer: new Uint8Array(buffer) })
  }

  public keyAeadGetPadding(options: KeyAeadGetPaddingOptions): number {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyAeadGetPadding(serializedOptions)))
  }

  public keyAeadGetParams(options: KeyAeadGetParamsOptions): AeadParams {
    const serializedOptions = serializeArguments(options)
    const ret = this.handleError(this.askar.keyAeadGetParams(serializedOptions))

    const { tagLength, nonceLength } = handleInvalidNullResponse(ret)

    return new AeadParams({ nonceLength, tagLength })
  }

  public keyAeadRandomNonce(options: KeyAeadRandomNonceOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyAeadRandomNonce(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyConvert(options: KeyConvertOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyConvert(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyCryptoBox(options: KeyCryptoBoxOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyCryptoBox(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyCryptoBoxOpen(options: KeyCryptoBoxOpenOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyCryptoBoxOpen(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyCryptoBoxRandomNonce(): Uint8Array {
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyCryptoBoxRandomNonce({})))
    return new Uint8Array(buf)
  }

  public keyCryptoBoxSeal(options: KeyCryptoBoxSealOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyCryptoBoxSeal(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyCryptoBoxSealOpen(options: KeyCryptoBoxSealOpenOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyCryptoBoxSealOpen(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyDeriveEcdh1pu(options: KeyDeriveEcdh1puOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyDeriveEcdh1pu(serializedOptions)))
    return new LocalKeyHandle(handle)
  }

  public keyDeriveEcdhEs(options: KeyDeriveEcdhEsOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyDeriveEcdhEs(serializedOptions)))
    return new LocalKeyHandle(handle)
  }

  public keyEntryListCount(options: KeyEntryListCountOptions): number {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyEntryListCount(serializedOptions)))
  }

  public keyEntryListFree(options: KeyEntryListFreeOptions): void {
    const serializedOptions = serializeArguments(options)

    // null resopnse is expected as we're freeing the object
    this.handleError(this.askar.keyEntryListFree(serializedOptions))
  }

  public keyEntryListGetAlgorithm(options: KeyEntryListGetAlgorithmOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyEntryListGetAlgorithm(serializedOptions)))
  }

  public keyEntryListGetMetadata(options: KeyEntryListGetMetadataOptions): string | null {
    const serializedOptions = serializeArguments(options)
    return this.handleError(this.askar.keyEntryListGetMetadata(serializedOptions))
  }

  public keyEntryListGetName(options: KeyEntryListGetNameOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyEntryListGetName(serializedOptions)))
  }

  public keyEntryListGetTags(options: KeyEntryListGetTagsOptions): string | null {
    const serializedOptions = serializeArguments(options)
    return this.handleError(this.askar.keyEntryListGetTags(serializedOptions))
  }

  public keyEntryListLoadLocal(options: KeyEntryListLoadLocalOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyEntryListLoadLocal(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyFree(options: KeyFreeOptions): void {
    const serializedOptions = serializeArguments(options)

    // null resopnse is expected as we're freeing the object
    this.handleError(this.askar.keyFree(serializedOptions))
  }

  public keyFromJwk(options: KeyFromJwkOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyFromJwk(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyFromKeyExchange(options: KeyFromKeyExchangeOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyFromKeyExchange(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyFromPublicBytes(options: KeyFromPublicBytesOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyFromPublicBytes(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyFromSecretBytes(options: KeyFromSecretBytesOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyFromSecretBytes(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyFromSeed(options: KeyFromSeedOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyFromSeed(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyGenerate(options: KeyGenerateOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyGenerate(serializedOptions)))

    return new LocalKeyHandle(handleInvalidNullResponse(handle))
  }

  public keyGetAlgorithm(options: KeyGetAlgorithmOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyGetAlgorithm(serializedOptions)))
  }

  public keyGetEphemeral(options: KeyGetEphemeralOptions): number {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyGetEphemeral(serializedOptions)))
  }

  public keyGetJwkPublic(options: KeyGetJwkPublicOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyGetJwkPublic(serializedOptions)))
  }

  public keyGetJwkSecret(options: KeyGetJwkSecretOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyGetJwkSecret(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyGetJwkThumbprint(options: KeyGetJwkThumbprintOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.keyGetJwkThumbprint(serializedOptions)))
  }

  public keyGetPublicBytes(options: KeyGetPublicBytesOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyGetPublicBytes(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyGetSecretBytes(options: KeyGetSecretBytesOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keyGetSecretBytes(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keySignMessage(options: KeySignMessageOptions): Uint8Array {
    const serializedOptions = serializeArguments(options)
    const buf = handleInvalidNullResponse(this.handleError(this.askar.keySignMessage(serializedOptions)))
    return new Uint8Array(buf)
  }

  public keyUnwrapKey(options: KeyUnwrapKeyOptions): LocalKeyHandle {
    const serializedOptions = serializeArguments(options)
    const handle = handleInvalidNullResponse(this.handleError(this.askar.keyUnwrapKey(serializedOptions)))

    return new LocalKeyHandle(handle)
  }

  public keyVerifySignature(options: KeyVerifySignatureOptions): boolean {
    const serializedOptions = serializeArguments(options)
    const result = this.handleError(this.askar.keyVerifySignature(serializedOptions))

    return !!result
  }

  public keyWrapKey(options: KeyWrapKeyOptions): EncryptedBuffer {
    const serializedOptions = serializeArguments(options)
    const ret = this.handleError(this.askar.keyWrapKey(serializedOptions))

    const { buffer, noncePos, tagPos } = handleInvalidNullResponse(ret)

    return new EncryptedBuffer({ tagPos, noncePos, buffer: new Uint8Array(buffer) })
  }

  public scanFree(options: ScanFreeOptions): void {
    const serializedOptions = serializeArguments(options)

    // null resopnse is expected as we're freeing the object
    this.handleError(this.askar.scanFree(serializedOptions))
  }

  public async scanNext(options: ScanNextOptions) {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.scanNext({ cb, ...serializedOptions })),
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async scanStart(options: ScanStartOptions): Promise<ScanHandle> {
    const { category, storeHandle, limit, offset, profile, tagFilter } = serializeArguments(options)
    const handle = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(
        this.askar.scanStart({
          cb,
          category,
          storeHandle,
          offset: offset || 0,
          limit: limit || -1,
          profile,
          tagFilter,
        }),
      ),
    )

    return ScanHandle.fromHandle(handle)
  }

  public sessionClose(options: SessionCloseOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.sessionClose({ cb, ...serializedOptions })))
  }

  public async sessionCount(options: SessionCountOptions): Promise<number> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.sessionCount({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public async sessionFetch(options: SessionFetchOptions) {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.sessionFetch({ cb, ...serializedOptions })),
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async sessionFetchAll(options: SessionFetchAllOptions) {
    const { category, sessionHandle, forUpdate, limit, tagFilter } = serializeArguments(options)
    const handle = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(
        this.askar.sessionFetchAll({ cb, category, sessionHandle, forUpdate, limit: limit || -1, tagFilter }),
      ),
    )

    return EntryListHandle.fromHandle(handle)
  }

  public async sessionFetchAllKeys(options: SessionFetchAllKeysOptions) {
    const { sessionHandle, algorithm, forUpdate, limit, thumbprint, tagFilter } = serializeArguments(options)
    const handle = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(
        this.askar.sessionFetchAllKeys({
          cb,
          sessionHandle,
          algorithm,
          forUpdate: forUpdate || -1,
          limit: limit || -1,
          thumbprint,
          tagFilter,
        }),
      ),
    )

    return KeyEntryListHandle.fromHandle(handle)
  }
  public async sessionFetchKey(options: SessionFetchKeyOptions) {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.sessionFetchKey({ cb, ...serializedOptions })),
    )

    return KeyEntryListHandle.fromHandle(handle)
  }

  public sessionInsertKey(options: SessionInsertKeyOptions): Promise<void> {
    const { sessionHandle, name, localKeyHandle, expiryMs, metadata, tags } = serializeArguments(options)
    return this.promisify((cb) =>
      this.handleError(
        this.askar.sessionInsertKey({
          cb,
          sessionHandle,
          name,
          localKeyHandle,
          expiryMs: expiryMs || -1,
          metadata,
          tags,
        }),
      ),
    )
  }

  public async sessionRemoveAll(options: SessionRemoveAllOptions): Promise<number> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.sessionRemoveAll({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public sessionRemoveKey(options: SessionRemoveKeyOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.sessionRemoveKey({ cb, ...serializedOptions })))
  }

  public async sessionStart(options: SessionStartOptions): Promise<SessionHandle> {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.sessionStart({ cb, ...serializedOptions })),
    )

    return SessionHandle.fromHandle(handle)
  }

  public sessionUpdate(options: SessionUpdateOptions): Promise<void> {
    const { category, name, operation, sessionHandle, expiryMs, tags, value } = serializeArguments(options)
    return this.promisify((cb) =>
      this.handleError(
        this.askar.sessionUpdate({
          cb,
          category,
          name,
          operation,
          sessionHandle,
          expiryMs: expiryMs || -1,
          tags,
          value,
        }),
      ),
    )
  }

  public sessionUpdateKey(options: SessionUpdateKeyOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.sessionUpdateKey({ cb, ...serializedOptions })))
  }

  public storeClose(options: StoreCloseOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.storeClose({ cb, ...serializedOptions })))
  }

  public storeCopyTo(options: StoreCopyToOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.storeCopyTo({ cb, ...serializedOptions })))
  }

  public async storeCreateProfile(options: StoreCreateProfileOptions): Promise<string> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.storeCreateProfile({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public storeGenerateRawKey(options: StoreGenerateRawKeyOptions): string {
    const serializedOptions = serializeArguments(options)
    return handleInvalidNullResponse(this.handleError(this.askar.storeGenerateRawKey(serializedOptions)))
  }

  public async storeGetProfileName(options: StoreGetProfileNameOptions): Promise<string> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.storeGetProfileName({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public async storeGetDefaultProfile(options: StoreGetDefaultProfileOptions): Promise<string> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<string>((cb) =>
      this.handleError(this.askar.storeGetDefaultProfile({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public async storeListProfiles(options: StoreListProfilesOptions): Promise<string[]> {
    const serializedOptions = serializeArguments(options)
    const stringListHandle = handleInvalidNullResponse(
      await this.promisifyWithResponse<string>((cb) =>
        this.handleError(this.askar.storeListProfiles({ cb, ...serializedOptions })),
      ),
    )
    const ret = []
    const count = this.handleError(this.askar.stringListCount({ stringListHandle }))
    for (let index = 0; index < count; index++) {
      ret.push(this.handleError(this.askar.stringListGetItem({ stringListHandle, index })))
    }
    this.handleError(this.askar.stringListFree({ stringListHandle }))
    return ret
  }

  public async storeOpen(options: StoreOpenOptions): Promise<StoreHandle> {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.storeOpen({ cb, ...serializedOptions })),
    )

    return StoreHandle.fromHandle(handle)
  }

  public async storeProvision(options: StoreProvisionOptions): Promise<StoreHandle> {
    const serializedOptions = serializeArguments(options)
    const handle = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.storeProvision({ cb, ...serializedOptions })),
    )

    return StoreHandle.fromHandle(handle)
  }

  public storeRekey(options: StoreRekeyOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.storeRekey({ cb, ...serializedOptions })))
  }

  public async storeRemove(options: StoreRemoveOptions): Promise<number> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.storeRemove({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public async storeRemoveProfile(options: StoreRemoveProfileOptions): Promise<number> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse<number>((cb) =>
      this.handleError(this.askar.storeRemoveProfile({ cb, ...serializedOptions })),
    )

    return handleInvalidNullResponse(response)
  }

  public async storeSetDefaultProfile(options: StoreSetDefaultProfileOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    const response = await this.promisifyWithResponse((cb) =>
      this.handleError(this.askar.storeSetDefaultProfile({ cb, ...serializedOptions })),
    )

    handleInvalidNullResponse(response)
  }

  public async migrateIndySdk(options: MigrateIndySdkOptions): Promise<void> {
    const serializedOptions = serializeArguments(options)
    return this.promisify((cb) => this.handleError(this.askar.migrateIndySdk({ cb, ...serializedOptions })))
  }
}
