import { deepStrictEqual } from 'node:assert'
import { CryptoBox, Key, KeyAlgorithm } from '@openwallet-foundation/askar-shared'
import { describe, test } from 'vitest'

describe('CryptoBox', () => {
  test('seal', () => {
    const x25519Key = Key.generate(KeyAlgorithm.X25519)

    const message = Uint8Array.from(Buffer.from('foobar'))
    const sealed = CryptoBox.seal({ recipientKey: x25519Key, message })

    const opened = CryptoBox.sealOpen({
      recipientKey: x25519Key,
      ciphertext: sealed,
    })

    deepStrictEqual(opened, message)

    x25519Key.handle.free()
  })
})
