import { Buffer } from 'buffer'
import { askar, NativeAskar } from '../askar'
import type { KeyAlgorithm, KeyBackend, SignatureAlgorithm } from '../enums'
import { KeyMethod, keyAlgorithmFromString } from '../enums'
import type { LocalKeyHandle } from './handles'

import { Jwk } from './Jwk'

export class Key {
  private localKeyHandle: LocalKeyHandle

  public constructor(handle: LocalKeyHandle) {
    this.localKeyHandle = handle
  }

  public static generate(algorithm: KeyAlgorithm, keyBackend?: KeyBackend, ephemeral = false) {
    return new Key(NativeAskar.instance.keyGenerate({ algorithm, keyBackend, ephemeral }))
  }

  public static fromSeed({
    method = KeyMethod.None,
    algorithm,
    seed,
  }: {
    algorithm: KeyAlgorithm
    seed: Uint8Array
    method?: KeyMethod
  }) {
    return new Key(NativeAskar.instance.keyFromSeed({ algorithm, method, seed }))
  }

  public static fromSecretBytes(options: { algorithm: KeyAlgorithm; secretKey: Uint8Array }) {
    return new Key(NativeAskar.instance.keyFromSecretBytes(options))
  }

  public static fromPublicBytes(options: { algorithm: KeyAlgorithm; publicKey: Uint8Array }) {
    return new Key(NativeAskar.instance.keyFromPublicBytes(options))
  }

  public static fromJwk(options: { jwk: Jwk }) {
    return new Key(NativeAskar.instance.keyFromJwk(options))
  }

  public convertkey(options: { algorithm: KeyAlgorithm }) {
    return new Key(NativeAskar.instance.keyConvert({ localKeyHandle: this.handle, ...options }))
  }

  public keyFromKeyExchange({ algorithm, publicKey }: { algorithm: KeyAlgorithm; publicKey: Key }) {
    return new Key(
      NativeAskar.instance.keyFromKeyExchange({
        skHandle: this.handle,
        pkHandle: publicKey.handle,
        algorithm,
      })
    )
  }

  public get handle() {
    return this.localKeyHandle
  }

  public get algorithm() {
    const alg = NativeAskar.instance.keyGetAlgorithm({ localKeyHandle: this.handle })
    return keyAlgorithmFromString(alg)
  }

  public get ephemeral() {
    return Boolean(NativeAskar.instance.keyGetEphemeral({ localKeyHandle: this.handle }))
  }

  public get publicBytes() {
    return NativeAskar.instance.keyGetPublicBytes({ localKeyHandle: this.handle })
  }

  public get secretBytes() {
    return NativeAskar.instance.keyGetSecretBytes({ localKeyHandle: this.handle })
  }

  public get jwkPublic(): Jwk {
    return Jwk.fromString(
      NativeAskar.instance.keyGetJwkPublic({
        localKeyHandle: this.handle,
        algorithm: this.algorithm,
      })
    )
  }

  public get jwkSecret() {
    const secretBytes = NativeAskar.instance.keyGetJwkSecret({
      localKeyHandle: this.handle,
    })
    return Jwk.fromString(Buffer.from(secretBytes).toString())
  }

  public get jwkThumbprint() {
    return NativeAskar.instance.keyGetJwkThumbprint({
      localKeyHandle: this.handle,
      algorithm: this.algorithm,
    })
  }

  public get aeadParams() {
    return NativeAskar.instance.keyAeadGetParams({ localKeyHandle: this.handle })
  }

  public get aeadRandomNonce() {
    return NativeAskar.instance.keyAeadRandomNonce({ localKeyHandle: this.handle })
  }

  public aeadEncrypt(options: { message: Uint8Array; nonce?: Uint8Array; aad?: Uint8Array }) {
    return NativeAskar.instance.keyAeadEncrypt({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public aeadDecrypt(options: { ciphertext: Uint8Array; nonce: Uint8Array; tag?: Uint8Array; aad?: Uint8Array }) {
    return NativeAskar.instance.keyAeadDecrypt({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public signMessage(options: { message: Uint8Array; sigType?: SignatureAlgorithm }) {
    return NativeAskar.instance.keySignMessage({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public verifySignature(options: { message: Uint8Array; signature: Uint8Array; sigType?: SignatureAlgorithm }) {
    return NativeAskar.instance.keyVerifySignature({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public wrapKey({ other, nonce }: { other: Key; nonce?: Uint8Array }) {
    return NativeAskar.instance.keyWrapKey({
      localKeyHandle: this.handle,
      other: other.handle,
      nonce,
    })
  }

  public unwrapKey(options: { algorithm: KeyAlgorithm; tag?: Uint8Array; ciphertext: Uint8Array; nonce?: Uint8Array }) {
    return new Key(NativeAskar.instance.keyUnwrapKey({ localKeyHandle: this.handle, ...options }))
  }
}
