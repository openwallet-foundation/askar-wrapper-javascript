import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import { Key, KeyAlgorithm, SignatureAlgorithm, type Store } from '@openwallet-foundation/askar-shared'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { setupWallet } from '../../askar-shared/tests/utils'
import { askarNodeJS } from '../src/index.js'

setFlagsFromString('--expose-gc')
const collectGarbage = runInNewContext('gc') as () => void

const ITERATIONS = 1000
const ROUNDS = 4

const memoryAfterGarbageCollection = async () => {
  // Finalizers and koffi's deferred frees run on the event loop, after the collection
  for (let i = 0; i < 4; i++) {
    collectGarbage()
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  const { rss, external, arrayBuffers } = process.memoryUsage()
  return { rss, external, arrayBuffers }
}

/**
 * Bytes that each call of `iteration` leaves behind, after a warm-up. A leak grows in every round and the noise of the
 * allocator does not, so the round that grew least counts
 */
const growthPerIteration = async (iteration: (index: number) => Promise<void> | void, iterations = ITERATIONS) => {
  let index = 0
  const round = async () => {
    for (let i = 0; i < iterations; i++) await iteration(index++)
    return await memoryAfterGarbageCollection()
  }

  let before = await round()
  const growth = {
    rss: Number.POSITIVE_INFINITY,
    external: Number.POSITIVE_INFINITY,
    arrayBuffers: Number.POSITIVE_INFINITY,
  }
  for (let i = 0; i < ROUNDS; i++) {
    const after = await round()
    for (const kind of ['rss', 'external', 'arrayBuffers'] as const) {
      growth[kind] = Math.min(growth[kind], (after[kind] - before[kind]) / iterations)
    }
    before = after
  }

  console.log(
    `${expect.getState().currentTestName}: ${Object.entries(growth)
      .map(([kind, bytes]) => `${kind} ${bytes.toFixed(0)}`)
      .join(', ')} bytes per iteration`
  )
  return growth
}

const message = new Uint8Array(64).fill(7)
const value = JSON.stringify({ data: 'x'.repeat(2000) })

describe('native memory', { timeout: 120_000 }, () => {
  let store: Store

  beforeEach(async () => {
    store = await setupWallet()

    const session = await store.openSession()
    for (let i = 0; i < 10; i++) {
      await session.insert({ category: 'leak', name: `scanned-${i}`, value, tags: { kind: 'scanned' } })
    }
    await session.close()
  })

  afterEach(async () => {
    await store.close(true)
  })

  // Before the entry lists of a scan and the strings that Askar returns were freed, this grew by about 30 kB per iteration
  test('does not grow with the operations of a server', async () => {
    const growth = await growthPerIteration(async (index) => {
      const name = `record-${index}`
      const session = await store.openSession()

      await session.insert({ category: 'leak', name, value, tags: { kind: 'inserted' } })
      await session.fetch({ category: 'leak', name })
      await session.fetchAll({ category: 'leak', tagFilter: { kind: 'inserted' } })
      await session.replace({ category: 'leak', name, value, tags: { kind: 'replaced' } })
      await store.scan({ category: 'leak', tagFilter: { kind: 'scanned' } }).fetchAll()
      await session.fetch({ category: 'leak', name: 'unknown' })
      // A duplicate: the error message is a string from Askar too
      await session.insert({ category: 'leak', name, value }).catch(() => undefined)

      const key = Key.generate(KeyAlgorithm.EcSecp256r1)
      const signature = key.signMessage({ message, sigType: SignatureAlgorithm.ES256 })
      const publicKey = Key.fromPublicBytes({ algorithm: KeyAlgorithm.EcSecp256r1, publicKey: key.publicBytes })
      publicKey.verifySignature({ message, signature, sigType: SignatureAlgorithm.ES256 })
      key.jwkPublic
      key.jwkThumbprint

      await session.insertKey({ name, key, tags: { kind: 'key' } })
      const fetched = await session.fetchKey({ name })
      await session.removeKey({ name })
      await session.remove({ category: 'leak', name })
      await session.close()

      key.handle.free()
      publicKey.handle.free()
      fetched?.key.handle.free()
    })

    expect(growth.rss).toBeLessThan(1024)
    expect(growth.external).toBeLessThan(64)
    expect(growth.arrayBuffers).toBeLessThan(64)
  })

  // A key that is never freed is about 160 bytes, so this grew by about 16 kB per iteration without the safety net
  test('frees keys that are garbage collected without being freed', async () => {
    // Not through NativeAskar.instance: the tests check that every key created through it is freed
    const growth = await growthPerIteration(() => {
      for (let i = 0; i < 100; i++) askarNodeJS.keyGenerate({ algorithm: KeyAlgorithm.EcSecp256r1, ephemeral: false })
    }, 100)

    expect(growth.rss).toBeLessThan(2048)
  })
})
