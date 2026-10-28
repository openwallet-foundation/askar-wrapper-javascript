import { NativeAskar } from '../askar'
import type { KeyAlgorithm } from '../enums'

import { Jwk } from './Jwk'
import { Key } from './Key'

// Calls fn with the key, created from the Jwk if it is one. A key created here is freed once fn returns, the caller's own
// keys are left alone
const withKey = <T>(key: Key | Jwk, fn: (key: Key) => T): T => {
  if (!(key instanceof Jwk)) return fn(key)

  const created = Key.fromJwk({ jwk: key })
  try {
    return fn(created)
  } finally {
    created.handle.free()
  }
}

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
      NativeAskar.instance.keyDeriveEcdhEs({
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
    return withKey(ephemeralKey, (eKey) =>
      withKey(recipientKey, (rKey) => {
        const derived = this.deriveKey({ encryptionAlgorithm, ephemeralKey: eKey, recipientKey: rKey, receive: false })
        try {
          return derived.aeadEncrypt({ message, aad, nonce })
        } finally {
          derived.handle.free()
        }
      })
    )
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
  }): Uint8Array {
    return withKey(ephemeralKey, (eKey) =>
      withKey(recipientKey, (rKey) => {
        const derived = this.deriveKey({ encryptionAlgorithm, ephemeralKey: eKey, recipientKey: rKey, receive: true })
        try {
          return derived.aeadDecrypt({ tag, nonce, ciphertext, aad })
        } finally {
          derived.handle.free()
        }
      })
    )
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
    try {
      return derived.wrapKey({ other: cek })
    } finally {
      derived.handle.free()
    }
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
    try {
      return derived.unwrapKey({ tag, nonce, ciphertext, algorithm: encryptionAlgorithm })
    } finally {
      derived.handle.free()
    }
  }
}
