import { promises } from 'node:fs'
import { AskarError, KdfMethod, Key, KeyAlgorithm, Store, StoreKeyMethod } from '@openwallet-foundation/askar-shared'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { firstEntry, getRawKey, secondEntry, setupWallet, testStoreUri } from './utils'

describe('Store and Session', () => {
  let store: Store

  beforeEach(async () => {
    store = await setupWallet()
  })

  afterEach(async () => {
    await store.close(true)
  })

  test('argon2i mod', async () => {
    const argon2iModStore = await Store.provision({
      recreate: true,
      passKey: 'abc',
      uri: testStoreUri,
      keyMethod: new StoreKeyMethod(KdfMethod.Argon2IMod),
    })

    const session = await argon2iModStore.openSession()

    expect(await session.fetch({ name: 'unknownKey', category: 'unknownCategory' })).toBe(null)

    await argon2iModStore.close()
  })

  test('argon2i int', async () => {
    const argon2iIntStore = await Store.provision({
      recreate: true,
      passKey: 'abc',
      uri: testStoreUri,
      keyMethod: new StoreKeyMethod(KdfMethod.Argon2IInt),
    })

    const session = await argon2iIntStore.openSession()

    expect(await session.fetch({ name: 'unknownKey', category: 'unknownCategory' })).toBe(null)

    await argon2iIntStore.close()
  })

  test('Rekey', async () => {
    const initialKey = Store.generateRawKey()

    const storagePath = './askar_tmp_db'
    try {
      await promises.access(storagePath)
    } catch {
      await promises.mkdir(storagePath)
    }

    let newStore = await Store.provision({
      recreate: true,
      profile: 'rekey',
      uri: `sqlite://${storagePath}/rekey.db`,
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: initialKey,
    })

    const newKey = Store.generateRawKey()
    await newStore.rekey({ keyMethod: new StoreKeyMethod(KdfMethod.Raw), passKey: newKey })

    await newStore.close()

    await expect(
      Store.open({
        profile: 'rekey',
        uri: `sqlite://${storagePath}/rekey.db`,
        keyMethod: new StoreKeyMethod(KdfMethod.Raw),
        passKey: initialKey,
      })
    ).rejects.toThrow(
      new AskarError({ code: 4, message: 'Error decrypting profile key\nCaused by: AEAD decryption error' })
    )

    newStore = await Store.open({
      profile: 'rekey',
      uri: `sqlite://${storagePath}/rekey.db`,
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: newKey,
    })

    await promises.rm(storagePath, { recursive: true, force: true }).catch()

    await newStore.close(true)
  })

  test('Insert', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    expect(await session.count(firstEntry)).toBeDefined()

    await session.close()
  })

  test('Replace', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    expect(await session.count(firstEntry)).toBe(1)

    const updatedEntry = { ...firstEntry, value: 'bar', tags: { update: 'baz' } }

    await session.replace(updatedEntry)

    expect(await session.count(updatedEntry)).toBe(1)

    await session.close()
  })

  test('Remove', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    expect(await session.count(firstEntry)).toBe(1)

    await session.remove(firstEntry)

    expect(await session.count(firstEntry)).toBe(0)

    await session.close()
  })

  test('Remove all', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)

    expect(await session.count(firstEntry)).toBe(2)

    await session.removeAll({ category: firstEntry.category })

    expect(await session.count(firstEntry)).toBe(0)

    await session.close()
  })

  test('Fetch all without category', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)

    expect(await session.count(firstEntry)).toBe(2)
    expect(await session.count({})).toBe(2)

    expect((await session.fetchAll({})).length).toBe(2)
    await session.removeAll({ category: firstEntry.category })

    expect(await session.count(firstEntry)).toBe(0)

    await session.close()
  })

  test('Scan', async () => {
    const scanStore = await setupWallet()
    const session = await scanStore.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)
    const found = (await scanStore.scan({ category: firstEntry.category }).fetchAll()).sort((a) =>
      a.name === 'testEntry' ? -1 : 1
    )

    expect(found.length).toBe(2)
    expect(found[0]).toEqual(firstEntry)
    expect(found[1]).toEqual({ ...secondEntry, value: JSON.stringify(secondEntry.value) })

    await session.close()
    await scanStore.close()
  })

  test('open sessions and scans', async () => {
    const store = await setupWallet()
    const session = await store.openSession()

    const openSessions = await store.listOpenSessions()
    expect(openSessions).toHaveLength(1)
    expect(openSessions[0].handle).toEqual(session.handle?.handle)

    await session.close()
    await expect(store.listOpenSessions()).resolves.toHaveLength(0)

    await expect(store.listOpenScans()).resolves.toHaveLength(0)
    await store.scan({ category: firstEntry.category }).fetchAll()
    await expect(store.listOpenScans()).resolves.toHaveLength(0)

    await store.close()
  })

  test('Transaction basic', async () => {
    const txn = await store.openSession(true)

    await txn.insert(firstEntry)

    expect(await txn.count(firstEntry)).toBe(1)

    expect(await txn.fetch(firstEntry)).toEqual(firstEntry)

    const found = await txn.fetchAll(firstEntry)

    expect(found[0]).toEqual(firstEntry)

    await txn.commit()

    const session = await store.openSession()

    expect(await session.fetch(firstEntry)).toEqual(firstEntry)

    await session.close()
  })

  test('Key store', async () => {
    const session = await store.openSession()

    const key = Key.generate(KeyAlgorithm.Ed25519)

    const keyName = 'testKey'

    await session.insertKey({ key, name: keyName, metadata: 'metadata', tags: { a: 'b' } })

    const fetchedKey1 = await session.fetchKey({ name: keyName })

    expect(fetchedKey1?.name).toBe(keyName)
    expect(fetchedKey1?.tags).toEqual({ a: 'b' })
    expect(fetchedKey1?.metadata).toBe('metadata')

    await session.updateKey({ name: keyName, metadata: 'updated metadata', tags: { a: 'c' } })
    const fetchedKey2 = await session.fetchKey({ name: keyName })

    expect(fetchedKey2?.name).toBe(keyName)
    expect(fetchedKey2?.tags).toEqual({ a: 'c' })
    expect(fetchedKey2?.metadata).toBe('updated metadata')

    expect(key.jwkThumbprint === fetchedKey1?.key.jwkThumbprint).toBe(true)

    const found = await session.fetchAllKeys({
      algorithm: KeyAlgorithm.Ed25519,
      thumbprint: key.jwkThumbprint,
      tagFilter: { a: 'c' },
    })

    expect(found[0].name).toBe(keyName)
    expect(found[0].tags).toEqual({ a: 'c' })
    expect(found[0].metadata).toBe('updated metadata')

    await session.removeKey({ name: keyName })

    expect(await session.fetchKey({ name: keyName })).toBe(null)

    await session.close()

    fetchedKey1?.key.handle.free()
    fetchedKey2?.key.handle.free()
    key.handle.free()

    for (const entry of found) {
      entry.key.handle.free()
    }
  })

  test('Profile', async () => {
    const session = await store.openSession()
    await session.insert(firstEntry)
    await session.close()

    const profile = await store.createProfile()

    const session2 = await store.session(profile).open()

    expect(await session2.count(firstEntry)).toBe(0)

    await session2.insert(firstEntry)

    expect(await session2.count(firstEntry)).toBe(1)

    await session2.close()

    if (!store.uri.includes(':memory:')) {
      const key = getRawKey()
      const store2 = await Store.open({ uri: testStoreUri, keyMethod: new StoreKeyMethod(KdfMethod.Raw), passKey: key })
      const session3 = await store2.openSession()

      expect(await session3.count(firstEntry)).toBe(0)

      await session3.close()
      await store2.close()
    }

    await expect(store.createProfile(profile)).rejects.toThrow(AskarError)

    const session4 = await store.session(profile).open()

    expect(await session4.count(firstEntry)).toBe(1)

    await session4.close()

    await store.setDefaultProfile(profile)

    expect(await store.getDefaultProfile()).toBe(profile)

    expect((await store.listProfiles()).includes(profile)).toBe(true)

    await store.removeProfile(profile)

    await expect(store.session(profile).open()).rejects.toThrow(AskarError)

    await expect(store.session('unknown profile').open()).rejects.toThrow(AskarError)

    expect(await store.createProfile(profile)).toBe(profile)

    const session7 = await store.session(profile).open()

    expect(await session7.count(firstEntry)).toBe(0)

    await session7.insert(firstEntry)

    expect(await session7.count(firstEntry)).toBe(1)

    await session7.close()

    expect(await store.renameProfile({ fromProfile: profile, toProfile: 'newProfileName' })).toBe(1)

    expect((await store.listProfiles()).includes('newProfileName')).toBe(true)

    expect((await store.listProfiles()).includes(profile)).toBe(false)

    const session8 = await store.session('newProfileName').open()

    expect(await session8.count(firstEntry)).toBe(1)

    await session8.close()

    const destinationStore = await Store.provision({
      uri: 'sqlite://:memory:',
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: getRawKey(),
      recreate: true,
    })

    expect(
      await store.copyProfile({
        toStore: destinationStore,
        fromProfile: 'newProfileName',
        toProfile: 'newerProfileName',
      })
    ).not.toBeDefined()

    const session9 = await destinationStore.session('newerProfileName').open()

    expect(await session9.count(firstEntry)).toBe(1)

    await session9.close()
  })

  test('Copy', async () => {
    const key = getRawKey()

    await expect(
      store.copyTo({
        uri: 'sqlite://:memory:',
        keyMethod: new StoreKeyMethod(KdfMethod.Raw),
        passKey: key,
        recreate: true,
      })
    ).resolves.toBeUndefined()
  })
})
