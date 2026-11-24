import { Jwk, Key, KeyAlgorithm, NativeAskar, SignatureAlgorithm } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'
import { utf8 } from './utils'

describe('keys', () => {
  test('supported backends', () => {
    const backends = NativeAskar.instance.keyGetSupportedBackends()

    expect(backends.length).toBe(1)
    expect(backends.includes('software')).toBe(true)
  })

  test('handle to JSON', () => {
    const key = Key.generate(KeyAlgorithm.Ed25519)

    expect(JSON.parse(JSON.stringify({ handle: key.handle }))).toEqual({ handle: key.handle.handle.toString() })

    key.handle.free()
  })

  test('aes cbc hmac', () => {
    const key = Key.generate(KeyAlgorithm.AesA128CbcHs256)

    expect(key.algorithm).toBe(KeyAlgorithm.AesA128CbcHs256)

    const messageString = 'test message'
    const message = utf8(messageString)
    const aeadNonce = key.aeadRandomNonce
    const params = key.aeadParams

    expect(params.nonceLength).toBe(16)
    expect(params.tagLength).toBe(16)

    const enc = key.aeadEncrypt({ message, nonce: aeadNonce })
    const dec = key.aeadDecrypt(enc.parts)

    expect(dec).toEqual(message)

    key.handle.free()
  })

  test('Bls G2 Keygen', () => {
    const seed = utf8('testseed000000000000000000000001')
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G2, seed })

    expect(key.jwkPublic).toEqual(
      new Jwk({
        crv: 'BLS12381G2',
        kty: 'EC',
        x: 'FH6hIRPzjlKW6LvPm0sHqyEbGqf8ag7UWpA_GFfefwq_kzDXSHmls9Yoza_be23zEw-pSOmKI_MGR1DahBa7Jbho2BGwDNV_QmyhxMYBwTH12Ltk_GLyPD4AP6pQVgge',
        y: 'CA1TwLRnETa8qPKPktW4XHSkD_9Qmuxb7syIiOMAjWKsIaptbF2USMVp40NqyV7XD8qQ_kM4QNme49eGyn_aQSsVdQKy7zSeBlRubTIc4Gl3vL-SHk8NlQJ41-NlTpBU',
      })
    )

    key.handle.free()
  })

  test('Bls G1 Keygen', () => {
    const seed = utf8('testseed000000000000000000000001')
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G1, seed })

    expect(key.jwkPublic).toEqual(
      new Jwk({
        crv: 'BLS12381G1',
        kty: 'EC',
        x: 'Bsjb9FSBUJXuB1fCluEcUBLeAPgIbnZGfxPKyeN3LVjQaKFWzXfNtMFAY8VL-eu-',
        y: 'BmNdJxcuusPBTqggIS-D-ItsxILnKz4q2G95at5K1d1-vFOtMJO0Aoh9OfGuQlvi',
      })
    )

    key.handle.free()
  })

  test('ed25519', () => {
    const key = Key.generate(KeyAlgorithm.Ed25519)

    expect(key.algorithm).toBe(KeyAlgorithm.Ed25519)

    const message = utf8('test message')
    const messageBuffer = utf8('test message')
    const signature = key.signMessage({ message })

    expect(key.verifySignature({ message, signature })).toBe(true)
    expect(key.verifySignature({ message: messageBuffer, signature })).toBe(true)
    expect(key.verifySignature({ message: utf8('other message'), signature })).toBe(false)
    expect(
      key.verifySignature({
        message: utf8('other message'),
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
        signature: utf8('random signature'),
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

    for (const k of [key, x25519Key, x25519Key2, kex]) k.handle.free()
  })

  test('p384', () => {
    const key = Key.generate(KeyAlgorithm.EcSecp384r1)

    expect(key.algorithm).toBe(KeyAlgorithm.EcSecp384r1)

    const message = utf8('test message')
    const signature = key.signMessage({ message })

    expect(key.verifySignature({ message, signature })).toBe(true)

    expect(key.jwkPublic.kty).toBe('EC')
    expect(key.jwkPublic.crv).toBe('P-384')

    expect(key.jwkSecret.kty).toBe('EC')
    expect(key.jwkSecret.crv).toBe('P-384')

    key.handle.free()
  })

  for (const [algorithm, sigType, jwkAlgorithm] of [
    [KeyAlgorithm.MlDsa44, SignatureAlgorithm.MlDsa44, 'ML-DSA-44'],
    [KeyAlgorithm.MlDsa65, SignatureAlgorithm.MlDsa65, 'ML-DSA-65'],
    [KeyAlgorithm.MlDsa87, SignatureAlgorithm.MlDsa87, 'ML-DSA-87'],
  ] as const) {
    test(`mldsa ${jwkAlgorithm}`, () => {
      const createdKeys: Key[] = []

      try {
        const key = Key.generate(algorithm)
        createdKeys.push(key)
        const message = utf8('ML-DSA test message')
        const signature = key.signMessage({ message, sigType })
        const alteredSignature = signature.slice()
        alteredSignature[0] ^= 1
        const seed = Uint8Array.from({ length: 32 }, (_, index) => index)
        const publicKey = Key.fromPublicBytes({ algorithm, publicKey: key.publicBytes })
        createdKeys.push(publicKey)
        const secretKey = Key.fromSecretBytes({ algorithm, secretKey: key.secretBytes })
        createdKeys.push(secretKey)
        const generatedFromSeed = Key.fromSeed({ algorithm, seed })
        createdKeys.push(generatedFromSeed)
        const repeatedSeedKey = Key.fromSeed({ algorithm, seed })
        createdKeys.push(repeatedSeedKey)
        const publicJwk = key.jwkPublic
        const secretJwk = key.jwkSecret
        const publicJwkKey = Key.fromJwk({ jwk: publicJwk })
        createdKeys.push(publicJwkKey)
        const secretJwkKey = Key.fromJwk({ jwk: secretJwk })
        createdKeys.push(secretJwkKey)
        const generatedFromSeedJwkKey = Key.fromJwk({ jwk: generatedFromSeed.jwkSecret })
        createdKeys.push(generatedFromSeedJwkKey)

        expect(key.algorithm).toBe(algorithm)
        expect(key.secretBytes.length).toBe(32)
        expect(publicKey.verifySignature({ message, signature, sigType })).toBe(true)
        expect(key.verifySignature({ message: utf8('different message'), signature, sigType })).toBe(false)
        expect(key.verifySignature({ message, signature: alteredSignature, sigType })).toBe(false)
        expect(secretKey.publicBytes).toEqual(key.publicBytes)
        expect(generatedFromSeed.publicBytes).toEqual(repeatedSeedKey.publicBytes)
        expect(generatedFromSeedJwkKey.publicBytes).toEqual(generatedFromSeed.publicBytes)
        expect(publicJwk).toEqual(expect.objectContaining({ alg: jwkAlgorithm, kty: 'AKP' }))
        expect(secretJwk).toEqual(expect.objectContaining({ alg: jwkAlgorithm, kty: 'AKP' }))
        expect(publicJwkKey.publicBytes).toEqual(key.publicBytes)
        expect(secretJwkKey.publicBytes).toEqual(key.publicBytes)
      } finally {
        for (const createdKey of createdKeys) createdKey.handle.free()
      }
    })
  }
})
