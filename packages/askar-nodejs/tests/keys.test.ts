import { Jwk, Key, KeyAlgorithm } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'
import { askarNodeJS } from '../src'

describe('keys', () => {
  test('supported backends', () => {
    const backends = askarNodeJS.keyGetSupportedBackends()

    expect(backends.length).toBe(1)
    expect(backends.includes('software')).toBe(true)
  })

  test('aes cbc hmac', () => {
    const key = Key.generate(KeyAlgorithm.AesA128CbcHs256)

    expect(key.algorithm).toBe(KeyAlgorithm.AesA128CbcHs256)

    const messageString = 'test message'
    const message = Uint8Array.from(Buffer.from(messageString))
    const aeadNonce = key.aeadRandomNonce
    const params = key.aeadParams

    expect(params.nonceLength).toBe(16)
    expect(params.tagLength).toBe(16)

    const enc = key.aeadEncrypt({ message, nonce: aeadNonce })
    const dec = key.aeadDecrypt(enc.parts)

    expect(dec).toEqual(message)
  })

  test('Bls G2 Keygen', () => {
    const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G2, seed })

    expect(key.jwkPublic).toEqual(
      new Jwk({
        crv: 'BLS12381G2',
        kty: 'EC',
        x: 'FH6hIRPzjlKW6LvPm0sHqyEbGqf8ag7UWpA_GFfefwq_kzDXSHmls9Yoza_be23zEw-pSOmKI_MGR1DahBa7Jbho2BGwDNV_QmyhxMYBwTH12Ltk_GLyPD4AP6pQVgge',
        y: 'CA1TwLRnETa8qPKPktW4XHSkD_9Qmuxb7syIiOMAjWKsIaptbF2USMVp40NqyV7XD8qQ_kM4QNme49eGyn_aQSsVdQKy7zSeBlRubTIc4Gl3vL-SHk8NlQJ41-NlTpBU',
      })
    )
  })

  test('Bls G1 Keygen', () => {
    const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G1, seed })

    expect(key.jwkPublic).toEqual(
      new Jwk({
        crv: 'BLS12381G1',
        kty: 'EC',
        x: 'Bsjb9FSBUJXuB1fCluEcUBLeAPgIbnZGfxPKyeN3LVjQaKFWzXfNtMFAY8VL-eu-',
        y: 'BmNdJxcuusPBTqggIS-D-ItsxILnKz4q2G95at5K1d1-vFOtMJO0Aoh9OfGuQlvi',
      })
    )
  })

  test('ed25519', () => {
    const key = Key.generate(KeyAlgorithm.Ed25519)

    expect(key.algorithm).toBe(KeyAlgorithm.Ed25519)

    const message = Uint8Array.from(Buffer.from('test message'))
    const messageBuffer = Buffer.from('test message')
    const signature = key.signMessage({ message })

    expect(key.verifySignature({ message, signature })).toBe(true)
    expect(key.verifySignature({ message: messageBuffer, signature })).toBe(true)
    expect(key.verifySignature({ message: Buffer.from('other message'), signature })).toBe(false)
    expect(
      key.verifySignature({
        message: Uint8Array.from(Buffer.from('other message')),
        signature,
      })
    ).toBe(false)
    expect(
      key.verifySignature({
        message,
        signature: Uint8Array.from([8, 1, 1, 1]),
      })
    ).toBe(false)
    expect(
      key.verifySignature({
        message,
        signature: Buffer.from('random signature'),
      })
    ).toBe(false)

    const x25519Key = key.convertkey({ algorithm: KeyAlgorithm.X25519 })
    const x25519Key2 = Key.generate(KeyAlgorithm.X25519)

    const kex = x25519Key.keyFromKeyExchange({
      algorithm: KeyAlgorithm.Chacha20XC20P,
      publicKey: x25519Key2,
    })

    expect(kex instanceof Key).toBe(true)

    expect(key.jwkPublic.kty).toBe('OKP')
    expect(key.jwkPublic.crv).toBe('Ed25519')

    expect(key.jwkSecret.kty).toBe('OKP')
    expect(key.jwkSecret.crv).toBe('Ed25519')
  })

  test('p384', () => {
    const key = Key.generate(KeyAlgorithm.EcSecp384r1)

    expect(key.algorithm).toBe(KeyAlgorithm.EcSecp384r1)

    const message = Uint8Array.from(Buffer.from('test message'))
    const signature = key.signMessage({ message })

    expect(key.verifySignature({ message, signature })).toBe(true)

    expect(key.jwkPublic.kty).toBe('EC')
    expect(key.jwkPublic.crv).toBe('P-384')

    expect(key.jwkSecret.kty).toBe('EC')
    expect(key.jwkSecret.crv).toBe('P-384')
  })
})
