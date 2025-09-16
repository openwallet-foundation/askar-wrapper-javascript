import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { before, describe, test } from 'node:test'
import { Jwk, Key, KeyAlgorithm, KeyMethod } from '@openwallet-foundation/askar-shared'
import { askarNodeJS } from '../src'
import { setup } from './utils'

describe('keys', () => {
  before(setup)

  test('supported backends', () => {
    const backends = askarNodeJS.keyGetSupportedBackends()

    strictEqual(backends.length, 1)
    ok(backends.includes('software'))
  })

  test('aes cbc hmac', () => {
    const key = Key.generate(KeyAlgorithm.AesA128CbcHs256)

    strictEqual(key.algorithm, KeyAlgorithm.AesA128CbcHs256)

    const messageString = 'test message'
    const message = Uint8Array.from(Buffer.from(messageString))
    const aeadNonce = key.aeadRandomNonce
    const params = key.aeadParams

    strictEqual(params.nonceLength, 16)
    strictEqual(params.tagLength, 16)

    const enc = key.aeadEncrypt({ message, nonce: aeadNonce })
    const dec = key.aeadDecrypt(enc.parts)

    deepStrictEqual(dec, message)
  })

  test('Bls G2 Keygen', () => {
    const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G2, seed })

    deepStrictEqual(
      key.jwkPublic,
      new Jwk({
        crv: 'BLS12381G2',
        kty: 'EC',
        x: 'FH6hIRPzjlKW6LvPm0sHqyEbGqf8ag7UWpA_GFfefwq_kzDXSHmls9Yoza_be23zEw-pSOmKI_MGR1DahBa7Jbho2BGwDNV_QmyhxMYBwTH12Ltk_GLyPD4AP6pQVgge',
        y: 'CA1TwLRnETa8qPKPktW4XHSkD_9Qmuxb7syIiOMAjWKsIaptbF2USMVp40NqyV7XD8qQ_kM4QNme49eGyn_aQSsVdQKy7zSeBlRubTIc4Gl3vL-SHk8NlQJ41-NlTpBU'
      })
    )
  })

  test('Bls G1 Keygen', () => {
    const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
    const key = Key.fromSeed({ algorithm: KeyAlgorithm.Bls12381G1, seed })

    deepStrictEqual(
      key.jwkPublic,
      new Jwk({
        crv: 'BLS12381G1',
        kty: 'EC',
        x: 'Bsjb9FSBUJXuB1fCluEcUBLeAPgIbnZGfxPKyeN3LVjQaKFWzXfNtMFAY8VL-eu-',
        y: 'BmNdJxcuusPBTqggIS-D-ItsxILnKz4q2G95at5K1d1-vFOtMJO0Aoh9OfGuQlvi'
      })
    )
  })

  test('ed25519', () => {
    const key = Key.generate(KeyAlgorithm.Ed25519)

    strictEqual(key.algorithm, KeyAlgorithm.Ed25519)

    const message = Uint8Array.from(Buffer.from('test message'))
    const messageBuffer = Buffer.from('test message')
    const signature = key.signMessage({ message })

    strictEqual(key.verifySignature({ message, signature }), true)
    strictEqual(key.verifySignature({ message: messageBuffer, signature }), true)
    strictEqual(key.verifySignature({ message: Buffer.from('other message'), signature }), false)
    strictEqual(
      key.verifySignature({
        message: Uint8Array.from(Buffer.from('other message')),
        signature,
      }),
      false
    )
    strictEqual(
      key.verifySignature({
        message,
        signature: Uint8Array.from([8, 1, 1, 1]),
      }),
      false
    )
    strictEqual(
      key.verifySignature({
        message,
        signature: Buffer.from('random signature'),
      }),
      false
    )

    const x25519Key = key.convertkey({ algorithm: KeyAlgorithm.X25519 })
    const x25519Key2 = Key.generate(KeyAlgorithm.X25519)

    const kex = x25519Key.keyFromKeyExchange({
      algorithm: KeyAlgorithm.Chacha20XC20P,
      publicKey: x25519Key2,
    })

    ok(kex instanceof Key)

    strictEqual(key.jwkPublic.kty, 'OKP')
    strictEqual(key.jwkPublic.crv, 'Ed25519')

    strictEqual(key.jwkSecret.kty, 'OKP')
    strictEqual(key.jwkSecret.crv, 'Ed25519')
  })

  test('p384', () => {
    const key = Key.generate(KeyAlgorithm.EcSecp384r1)

    strictEqual(key.algorithm, KeyAlgorithm.EcSecp384r1)

    const message = Uint8Array.from(Buffer.from('test message'))
    const signature = key.signMessage({ message })

    strictEqual(key.verifySignature({ message, signature }), true)

    strictEqual(key.jwkPublic.kty, 'EC')
    strictEqual(key.jwkPublic.crv, 'P-384')

    strictEqual(key.jwkSecret.kty, 'EC')
    strictEqual(key.jwkSecret.crv, 'P-384')
  })
})
