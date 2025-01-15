import { doesNotReject, doesNotThrow, rejects, throws } from 'node:assert'
import { before, describe, test } from 'node:test'
import { AskarError, KeyAlgorithm, askar } from '@openwallet-foundation/askar-shared'
import { setup, setupWallet } from './utils'

describe('Error', () => {
  before(setup)

  test('set error code to 0 after correct call', () => {
    doesNotThrow(() =>
      askar.keyGenerate({
        algorithm: KeyAlgorithm.AesA128CbcHs256,
        ephemeral: true,
      })
    )
  })

  test('set error code to non 0 after incorrect call', () => {
    throws(
      () => askar.keyGenerate({ algorithm: 'incorrect-alg', ephemeral: true }),
      new AskarError({ code: 8, message: 'Unknown key algorithm' })
    )
  })

  test('set error code to 0 correct async call', async () => {
    const store = await setupWallet()

    await doesNotReject(() => store.openSession())
  })

  test('set error code to non 0 incorrect async call where the error is outside the callback', async () => {
    const store = await setupWallet()

    // @ts-expect-error: testing invalid call
    await rejects(() => store.removeProfile(), { code: 5, message: 'Profile name not provided' })
  })

  test('set error code to non 0 incorrect async call where the error is inside the callback', async () => {
    const store = await setupWallet()
    await store.close()

    await rejects(() => store.close(), { code: 5, message: 'Invalid store handle' })
  })
})
