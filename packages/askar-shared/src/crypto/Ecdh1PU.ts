import { NativeAskar } from '../askar'
import type { KeyAlgorithm } from '../enums'
import { Key } from './Key'

export class Ecdh1PU {
  private algId: Uint8Array
  private apu: Uint8Array
  private apv: Uint8Array

  public constructor({ apv, apu, algId }: { algId: Uint8Array; apu: Uint8Array; apv: Uint8Array }) {
    this.algId = algId
    this.apu = apu
    this.apv = apv
  }

  public deriveKey({
    encryptionAlgorithm,
    ephemeralKey,
    recipientKey,
    senderKey,
    receive,
    ccTag,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    senderKey: Key
    receive: boolean
    ccTag?: Uint8Array
  }): Key {
    return new Key(
      NativeAskar.instance.keyDeriveEcdh1pu({
        algId: this.algId,
        receive,
        apv: this.apv,
        apu: this.apu,
        algorithm: encryptionAlgorithm,
        ephemeralKey: ephemeralKey,
        recipientKey: recipientKey,
        senderKey: senderKey,
        ccTag,
      })
    )
  }

  public encryptDirect({
    encryptionAlgorithm,
    recipientKey,
    ephemeralKey,
    senderKey,
    message,
    aad,
    nonce,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    senderKey: Key
    message: Uint8Array
    aad?: Uint8Array
    nonce?: Uint8Array
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: encryptionAlgorithm,
      ephemeralKey,
      recipientKey,
      senderKey,
      receive: false,
    })
    try {
      return derived.aeadEncrypt({ message, aad, nonce })
    } finally {
      derived.handle.free()
    }
  }

  public decryptDirect({
    nonce,
    encryptionAlgorithm,
    recipientKey,
    ephemeralKey,
    senderKey,
    ciphertext,
    tag,
    aad,
  }: {
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    senderKey: Key
    ciphertext: Uint8Array
    nonce: Uint8Array
    tag: Uint8Array
    aad?: Uint8Array
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: encryptionAlgorithm,
      ephemeralKey,
      recipientKey,
      senderKey,
      receive: true,
    })
    try {
      return derived.aeadDecrypt({ tag, nonce, ciphertext, aad })
    } finally {
      derived.handle.free()
    }
  }

  public senderWrapKey({
    keyWrappingAlgorithm,
    ephemeralKey,
    recipientKey,
    senderKey,
    cek,
    ccTag,
  }: {
    keyWrappingAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    senderKey: Key
    cek: Key
    ccTag: Uint8Array
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: keyWrappingAlgorithm,
      ephemeralKey,
      recipientKey,
      senderKey,
      receive: false,
      ccTag,
    })
    try {
      return derived.wrapKey({ other: cek })
    } finally {
      derived.handle.free()
    }
  }

  public receiverUnwrapKey({
    keyWrappingAlgorithm,
    encryptionAlgorithm,
    recipientKey,
    ephemeralKey,
    senderKey,
    ciphertext,
    nonce,
    tag,
    ccTag,
  }: {
    keyWrappingAlgorithm: KeyAlgorithm
    encryptionAlgorithm: KeyAlgorithm
    ephemeralKey: Key
    recipientKey: Key
    senderKey: Key
    ciphertext: Uint8Array
    nonce?: Uint8Array
    tag?: Uint8Array
    ccTag: Uint8Array
  }) {
    const derived = this.deriveKey({
      encryptionAlgorithm: keyWrappingAlgorithm,
      ephemeralKey,
      recipientKey,
      receive: true,
      senderKey,
      ccTag,
    })
    try {
      return derived.unwrapKey({ tag, nonce, ciphertext, algorithm: encryptionAlgorithm })
    } finally {
      derived.handle.free()
    }
  }
}
