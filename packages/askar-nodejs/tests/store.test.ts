import { Store, StoreKeyMethod, Key, KeyAlgs, AskarError, KdfMethod } from '@owf/askar-shared'
import { promises } from 'fs'

import { firstEntry, getRawKey, secondEntry, setup, setupWallet, testStoreUri } from './utils'
import test, { afterEach, before, beforeEach, describe } from 'node:test'
import { deepStrictEqual, strictEqual, throws } from 'node:assert'

describe('Store and Session', () => {
  let store: Store

  before(setup)

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
    strictEqual(await session.fetch({ name: 'unknownKey', category: 'unknownCategory' }), null)

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
    strictEqual(await session.fetch({ name: 'unknownKey', category: 'unknownCategory' }), null)

    await argon2iIntStore.close()
  })

  test('Rekey', async () => {
    const initialKey = Store.generateRawKey()

    // Make sure db directory exists
    const storagePath = './tmp'
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

    throws(await 
      Store.open({
        profile: 'rekey',
        uri: `sqlite://${storagePath}/rekey.db`,
        keyMethod: new StoreKeyMethod(KdfMethod.Raw),
        passKey: initialKey,
      }))

    newStore = await Store.open({
      profile: 'rekey',
      uri: `sqlite://${storagePath}/rekey.db`,
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: newKey,
    })

    await newStore.close(true)
  })

  test('Insert', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    strictEqual(await session.count(firstEntry), 1)

    await session.close()
  })

  test('Replace', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    strictEqual(await session.count(firstEntry), 1)

    const updatedEntry = { ...firstEntry, value: 'bar', tags: { update: 'baz' } }

    await session.replace(updatedEntry)

    strictEqual(await session.count(updatedEntry), 1)

    await session.close()
  })

  test('Remove', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)

    strictEqual(await session.count(firstEntry), 1)

    await session.remove(firstEntry)

    strictEqual(await session.count(firstEntry), 0)

    await session.close()
  })

  test('Remove all', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)

    strictEqual(await session.count(firstEntry), 2)

    await session.removeAll({ category: firstEntry.category })

    strictEqual(await session.count(firstEntry), 0)

    await session.close()
  })

  test('Scan', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)
    const found = await store.scan({ category: firstEntry.category }).fetchAll()
    strictEqual(found.length, 2)

    // value is converted to string, so we expect it as string at this level
    deepStrictEqual(found, [firstEntry, { ...secondEntry, value: JSON.stringify(secondEntry.value) }])

    await session.close()
  })

  test('Transaction basic', async () => {
    const txn = await store.openSession(true)

    await txn.insert(firstEntry)

    strictEqual(txn.count(firstEntry), 1)

    deepStrictEqual(await txn.fetch(firstEntry), firstEntry)

    const found = await txn.fetchAll(firstEntry)

    deepStrictEqual(found[0], firstEntry)

    await txn.commit()

    const session = await store.openSession()

    deepStrictEqual(await session.fetch(firstEntry), firstEntry)
  })

  test('Key store', async () => {
    const session = await store.openSession()

    const key = Key.generate(KeyAlgs.Ed25519)

    const keyName = 'testKey'

    await session.insertKey({ key, name: keyName, metadata: 'metadata', tags: { a: 'b' } })

    const fetchedKey1 = await session.fetchKey({ name: keyName })
    const __fetchedKey1 = fetchedKey1
    deepStrictEqual(__fetchedKey1, {
      name: keyName,
      tags: { a: 'b' },
      metadata: 'metadata',
    })

    await session.updateKey({ name: keyName, metadata: 'updated metadata', tags: { a: 'c' } })
    const fetchedKey2 = await session.fetchKey({ name: keyName })
    const __fetchedKey2 = fetchedKey2
    deepStrictEqual(__fetchedKey2, {
      name: keyName,
      tags: { a: 'c' },
      metadata: 'updated metadata',
    })

    strictEqual(key.jwkThumbprint, fetchedKey1?.key.jwkThumbprint)

    const found = await session.fetchAllKeys({
      algorithm: KeyAlgs.Ed25519,
      thumbprint: key.jwkThumbprint,
      tagFilter: { a: 'c' },
    })

    deepStrictEqual(found[0], { name: keyName, metadata: 'updated metadata', tags: { a: 'c' } })

    await session.removeKey({ name: keyName })

    strictEqual(session.fetchKey({ name: keyName }), null)

    await session.close()

    // Clear objects
    fetchedKey1?.key.handle.free()
    fetchedKey2?.key.handle.free()
    key.handle.free()
    for(const entry of found) {
      entry.key.handle.free()
    }
  })

  test('Profile', async () => {
    const session = await store.openSession()
    await session.insert(firstEntry)
    await session.close()

    const profile = await store.createProfile()

    const session2 = await store.session(profile).open()
    //Should not find previously stored record
    strictEqual(await session2.count(firstEntry), 0)
    await session2.insert(firstEntry)
    strictEqual(await session2.count(firstEntry), 1)
    await session2.close()

    if (!store.uri.includes(':memory:')) {
      // Test accessing profile after re-opening
      const key = getRawKey()
      const store2 = await Store.open({ uri: testStoreUri, keyMethod: new StoreKeyMethod(KdfMethod.Raw), passKey: key })
      const session3 = await store2.openSession()
      //Should not find previously stored record
      strictEqual(await session3.count(firstEntry), 0)
      await session3.close()
      await store2.close()
    }

    throws(await store.createProfile(profile), AskarError)

    // Check if profile is still usable
    const session4 = await store.session(profile).open()
    strictEqual(await session4.count(firstEntry), 1)
    await session4.close()

    await store.setDefaultProfile(profile)
    strictEqual(await store.getDefaultProfile(), profile)

    deepStrictEqual(await store.listProfiles(), [profile])

    await store.removeProfile(profile)

    // Opening removed profile should fail
    throws(await store.session(profile).open(), AskarError)

    // Unknown unknown profile should fail
    throws(await store.session('unknown profile').open(), AskarError)

    strictEqual(await store.createProfile(profile), profile)

    const session7 = await store.session(profile).open()
    strictEqual(session7.count(firstEntry), 0)
    await session7.close()
  })

  test('Copy', async () => {
    const key = getRawKey()

    await store.copyTo({
      uri: 'sqlite://:memory:',
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: key,
      recreate: true,
    })
  })
})
