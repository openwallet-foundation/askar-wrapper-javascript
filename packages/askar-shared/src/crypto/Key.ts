import type { KeyAlgorithm, SignatureAlgorithm } from '../enums'
import type { KeyBackend } from '../enums'
import type { LocalKeyHandle } from './handles'

import { Buffer } from 'buffer'

import { askar } from '../askar'
import { KeyMethod, keyAlgorithmFromString } from '../enums'

import { Jwk } from './Jwk'

export class Key {
  private localKeyHandle: LocalKeyHandle

  public constructor(handle: LocalKeyHandle) {
    this.localKeyHandle = handle
  }

  public static generate(algorithm: KeyAlgorithm, keyBackend?: KeyBackend, ephemeral = false) {
    return new Key(askar.keyGenerate({ algorithm, keyBackend, ephemeral }))
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
    return new Key(askar.keyFromSeed({ algorithm, method, seed }))
  }

  public static fromSecretBytes(options: { algorithm: KeyAlgorithm; secretKey: Uint8Array }) {
    return new Key(askar.keyFromSecretBytes(options))
  }

  public static fromPublicBytes(options: { algorithm: KeyAlgorithm; publicKey: Uint8Array }) {
    return new Key(askar.keyFromPublicBytes(options))
  }

  public static fromJwk(options: { jwk: Jwk }) {
    return new Key(askar.keyFromJwk(options))
  }

  public convertkey(options: { algorithm: KeyAlgorithm }) {
    return new Key(askar.keyConvert({ localKeyHandle: this.handle, ...options }))
  }

  public keyFromKeyExchange({ algorithm, publicKey }: { algorithm: KeyAlgorithm; publicKey: Key }) {
    return new Key(
      askar.keyFromKeyExchange({
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
    const alg = askar.keyGetAlgorithm({ localKeyHandle: this.handle })
    return keyAlgorithmFromString(alg)
  }

  public get ephemeral() {
    return Boolean(askar.keyGetEphemeral({ localKeyHandle: this.handle }))
  }

  public get publicBytes() {
    return askar.keyGetPublicBytes({ localKeyHandle: this.handle })
  }

  public get secretBytes() {
    return askar.keyGetSecretBytes({ localKeyHandle: this.handle })
  }

  public get jwkPublic(): Jwk {
    return Jwk.fromString(
      askar.keyGetJwkPublic({
        localKeyHandle: this.handle,
        algorithm: this.algorithm,
      })
    )
  }

  public get jwkSecret() {
    const secretBytes = askar.keyGetJwkSecret({
      localKeyHandle: this.handle,
    })
    return Jwk.fromString(Buffer.from(secretBytes).toString())
  }

  public get jwkThumbprint() {
    return askar.keyGetJwkThumbprint({
      localKeyHandle: this.handle,
      algorithm: this.algorithm,
    })
  }

  public get aeadParams() {
    return askar.keyAeadGetParams({ localKeyHandle: this.handle })
  }

  public get aeadRandomNonce() {
    return askar.keyAeadRandomNonce({ localKeyHandle: this.handle })
  }

  public aeadEncrypt(options: { message: Uint8Array; nonce?: Uint8Array; aad?: Uint8Array }) {
    return askar.keyAeadEncrypt({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public aeadDecrypt(options: { ciphertext: Uint8Array; nonce: Uint8Array; tag?: Uint8Array; aad?: Uint8Array }) {
    return askar.keyAeadDecrypt({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public signMessage(options: { message: Uint8Array; sigType?: SignatureAlgorithm }) {
    return askar.keySignMessage({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public verifySignature(options: { message: Uint8Array; signature: Uint8Array; sigType?: SignatureAlgorithm }) {
    return askar.keyVerifySignature({
      localKeyHandle: this.handle,
      ...options,
    })
  }

  public wrapKey({ other, nonce }: { other: Key; nonce?: Uint8Array }) {
    return askar.keyWrapKey({
      localKeyHandle: this.handle,
      other: other.handle,
      nonce,
    })
  }

  public unwrapKey(options: { algorithm: KeyAlgorithm; tag?: Uint8Array; ciphertext: Uint8Array; nonce?: Uint8Array }) {
    return new Key(askar.keyUnwrapKey({ localKeyHandle: this.handle, ...options }))
  }
}
