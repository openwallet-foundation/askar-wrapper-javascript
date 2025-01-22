import type { KeyAlgorithm } from '../enums'

import { askar } from '../askar'

import { Jwk } from './Jwk'
import { Key } from './Key'

export class EcdhEs {
  private algId: Uint8Array
  private apu: Uint8Array
  private apv: Uint8Array

  public constructor({ apv, apu, algId }: { algId: Uint8Array; apu: Uint8Array; apv: Uint8Array }) {
    this.algId = algId
    this.apu = apu
    this.apv = apv
  }

  private deriveKey({
    encryptionAlgorithm,
    ephemeralKey,
    recipientKey,
    receive,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    receive: boolean
  }): Key {
    return new Key(
      askar.keyDeriveEcdhEs({
        algId: this.algId,
        receive,
        apv: this.apv,
        apu: this.apu,
        algorithm: encryptionAlgorithm,
        ephemeralKey,
        recipientKey,
      })
    )
  }

  public encryptDirect({
    encryptionAlgorithm,
    recipientKey,
    ephemeralKey,
    message,
    aad,
    nonce,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key | Jwk
    recipientKey: Key | Jwk
    message: Uint8Array
    aad?: Uint8Array
    nonce?: Uint8Array
  }) {
    const eKey = ephemeralKey instanceof Jwk ? Key.fromJwk({ jwk: ephemeralKey }) : ephemeralKey
    const rKey = recipientKey instanceof Jwk ? Key.fromJwk({ jwk: recipientKey }) : recipientKey
    const derived = this.deriveKey({ encryptionAlgorithm, ephemeralKey: eKey, recipientKey: rKey, receive: false })
    const encryptedBuffer = derived.aeadEncrypt({ message, aad, nonce })
    derived.handle.free()
    return encryptedBuffer
  }

  public decryptDirect({
    nonce,
    encryptionAlgorithm,
    recipientKey,
    ciphertext,
    ephemeralKey,
    tag,
    aad,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key | Jwk
    recipientKey: Key | Jwk
    ciphertext: Uint8Array
    nonce: Uint8Array
    tag: Uint8Array
    aad?: Uint8Array
  }) {
    const eKey = ephemeralKey instanceof Jwk ? Key.fromJwk({ jwk: ephemeralKey }) : ephemeralKey
    const rKey = recipientKey instanceof Jwk ? Key.fromJwk({ jwk: recipientKey }) : recipientKey
    const derived = this.deriveKey({ encryptionAlgorithm, ephemeralKey: eKey, recipientKey: rKey, receive: true })
    const encryptedBuffer = derived.aeadDecrypt({ tag, nonce, ciphertext, aad })
    derived.handle.free()
    return encryptedBuffer
  }

  public senderWrapKey({
    keyWrappingAlgorithm,
    ephemeralKey,
    recipientKey,
    cek,
  }: {
    keyWrappingAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    cek: Key
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: keyWrappingAlgorithm,
      ephemeralKey,
      recipientKey,
      receive: false,
    })
    const encryptedBuffer = derived.wrapKey({ other: cek })
    derived.handle.free()
    return encryptedBuffer
  }

  public receiverUnwrapKey({
    recipientKey,
    keyWrappingAlgorithm,
    ephemeralKey,
    encryptionAlgorithm,
    ciphertext,
    nonce,
    tag,
  }: {
    keyWrappingAlgorithm: KeyAlgorithm
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    ciphertext: Uint8Array
    nonce?: Uint8Array
    tag?: Uint8Array
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: keyWrappingAlgorithm,
      ephemeralKey,
      recipientKey,
      receive: true,
    })
    const encryptedBuffer = derived.unwrapKey({ tag, nonce, ciphertext, algorithm: encryptionAlgorithm })
    derived.handle.free()
    return encryptedBuffer
  }
}
