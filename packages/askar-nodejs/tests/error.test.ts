import { AskarError, KeyAlgorithm, NativeAskar } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'
import { setupWallet } from './utils'

describe('Error', () => {
  test('set error code to 0 after correct call', () => {
    expect(() =>
      NativeAskar.instance.keyGenerate({
        algorithm: KeyAlgorithm.AesA128CbcHs256,
        ephemeral: true,
      })
    ).not.toThrow()
  })

  test('set error code to non 0 after incorrect call', () => {
    expect(() =>
      NativeAskar.instance.keyGenerate({ algorithm: 'incorrect-alg' as KeyAlgorithm, ephemeral: true })
    ).toThrow(new AskarError({ code: 8, message: 'Unknown key algorithm' }))
  })

  test('set error code to 0 correct async call', async () => {
    const store = await setupWallet()

    await expect(store.openSession()).resolves.toBeDefined()
  })

  test('set error code to non 0 incorrect async call where the error is outside the callback', async () => {
    const store = await setupWallet()
    await store.close()

    // @ts-expect-error: testing invalid call
    await expect(store.removeProfile()).rejects.toMatchObject({ code: 5, message: 'Profile name not provided' })
  })

  test('set error code to non 0 incorrect async call where the error is inside the callback', async () => {
    const store = await setupWallet()
    await store.close()

    await expect(store.close()).rejects.toMatchObject({ code: 5, message: 'Invalid store handle' })
  })
})
