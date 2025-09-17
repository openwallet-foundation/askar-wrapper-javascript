import { deepStrictEqual, doesNotReject, ok, rejects, strictEqual } from 'node:assert'
import { promises } from 'node:fs'
import { afterEach, before, beforeEach, describe, test } from 'node:test'
import { AskarError, KdfMethod, Key, KeyAlgorithm, Store, StoreKeyMethod } from '@openwallet-foundation/askar-shared'
import { firstEntry, getRawKey, secondEntry, setup, setupWallet, testStoreUri } from './utils'

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

    await rejects(
      () =>
        Store.open({
          profile: 'rekey',
          uri: `sqlite://${storagePath}/rekey.db`,
          keyMethod: new StoreKeyMethod(KdfMethod.Raw),
          passKey: initialKey,
        }),
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

  test('Fetch all without category', async () => {
    const session = await store.openSession()

    await session.insert(firstEntry)
    await session.insert(secondEntry)

    strictEqual(await session.count(firstEntry), 2)
    strictEqual(await session.count({}), 2)

    strictEqual((await session.fetchAll({})).length, 2)
    await session.removeAll({ category: firstEntry.category })

    strictEqual(await session.count(firstEntry), 0)

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

    strictEqual(found.length, 2)
    deepStrictEqual(found[0], firstEntry)
    deepStrictEqual(found[1], { ...secondEntry, value: JSON.stringify(secondEntry.value) })

    await session.close()
    await scanStore.close()
  })

  test('Transaction basic', async () => {
    const txn = await store.openSession(true)

    await txn.insert(firstEntry)

    strictEqual(await txn.count(firstEntry), 1)

    deepStrictEqual(await txn.fetch(firstEntry), firstEntry)

    const found = await txn.fetchAll(firstEntry)

    deepStrictEqual(found[0], firstEntry)

    await txn.commit()

    const session = await store.openSession()

    deepStrictEqual(await session.fetch(firstEntry), firstEntry)

    await session.close()
  })

  test('Key store', async () => {
    const session = await store.openSession()

    const key = Key.generate(KeyAlgorithm.Ed25519)

    const keyName = 'testKey'

    await session.insertKey({ key, name: keyName, metadata: 'metadata', tags: { a: 'b' } })

    const fetchedKey1 = await session.fetchKey({ name: keyName })

    strictEqual(fetchedKey1?.name, keyName)
    deepStrictEqual(fetchedKey1?.tags, { a: 'b' })
    deepStrictEqual(fetchedKey1?.metadata, 'metadata')

    await session.updateKey({ name: keyName, metadata: 'updated metadata', tags: { a: 'c' } })
    const fetchedKey2 = await session.fetchKey({ name: keyName })

    strictEqual(fetchedKey2?.name, keyName)
    deepStrictEqual(fetchedKey2?.tags, { a: 'c' })
    deepStrictEqual(fetchedKey2?.metadata, 'updated metadata')

    ok(key.jwkThumbprint === fetchedKey1?.key.jwkThumbprint)

    const found = await session.fetchAllKeys({
      algorithm: KeyAlgorithm.Ed25519,
      thumbprint: key.jwkThumbprint,
      tagFilter: { a: 'c' },
    })

    strictEqual(found[0].name, keyName)
    deepStrictEqual(found[0].tags, { a: 'c' })
    deepStrictEqual(found[0].metadata, 'updated metadata')

    await session.removeKey({ name: keyName })

    strictEqual(await session.fetchKey({ name: keyName }), null)

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

    strictEqual(await session2.count(firstEntry), 0)

    await session2.insert(firstEntry)

    strictEqual(await session2.count(firstEntry), 1)

    await session2.close()

    if (!store.uri.includes(':memory:')) {
      const key = getRawKey()
      const store2 = await Store.open({ uri: testStoreUri, keyMethod: new StoreKeyMethod(KdfMethod.Raw), passKey: key })
      const session3 = await store2.openSession()

      strictEqual(await session3.count(firstEntry), 0)

      await session3.close()
      await store2.close()
    }

    await rejects(() => store.createProfile(profile), AskarError)

    const session4 = await store.session(profile).open()

    strictEqual(await session4.count(firstEntry), 1)

    await session4.close()

    await store.setDefaultProfile(profile)

    deepStrictEqual(await store.getDefaultProfile(), profile)

    ok((await store.listProfiles()).includes(profile))

    await store.removeProfile(profile)

    await rejects(() => store.session(profile).open(), AskarError)

    await rejects(() => store.session('unknown profile').open(), AskarError)

    deepStrictEqual(await store.createProfile(profile), profile)

    const session7 = await store.session(profile).open()

    strictEqual(await session7.count(firstEntry), 0)

    await session7.insert(firstEntry)

    strictEqual(await session7.count(firstEntry), 1)

    await session7.close()

    ok(await store.renameProfile({ fromProfile: profile, toProfile: 'newProfileName' }))

    ok((await store.listProfiles()).includes('newProfileName'))

    ok(!(await store.listProfiles()).includes(profile))

    const session8 = await store.session('newProfileName').open()

    strictEqual(await session8.count(firstEntry), 1)

    await session8.close()

    const destinationStore = await Store.provision({
      uri: 'sqlite://:memory:',
      keyMethod: new StoreKeyMethod(KdfMethod.Raw),
      passKey: getRawKey(),
      recreate: true,
    })

    ok(
      await store.copyProfile({
        toStore: destinationStore,
        fromProfile: 'newProfileName',
        toProfile: 'newerProfileName',
      })
    )

    const session9 = await destinationStore.session('newerProfileName').open()

    strictEqual(await session9.count(firstEntry), 1)

    await session9.close()
  })

  test('Copy', async () => {
    const key = getRawKey()

    await doesNotReject(() =>
      store.copyTo({
        uri: 'sqlite://:memory:',
        keyMethod: new StoreKeyMethod(KdfMethod.Raw),
        passKey: key,
        recreate: true,
      })
    )
  })
})
