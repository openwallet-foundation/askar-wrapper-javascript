import { CryptoBox, Key, KeyAlgorithm } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'
import { utf8 } from './utils'

describe('CryptoBox', () => {
  test('seal', () => {
    const x25519Key = Key.generate(KeyAlgorithm.X25519)

    const message = utf8('foobar')
    const sealed = CryptoBox.seal({ recipientKey: x25519Key, message })

    const opened = CryptoBox.sealOpen({
      recipientKey: x25519Key,
      ciphertext: sealed,
    })

    expect(opened).toEqual(message)

    x25519Key.handle.free()
  })
})
