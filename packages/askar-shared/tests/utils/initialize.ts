import { KdfMethod, Store, StoreKeyMethod } from '@openwallet-foundation/askar-shared'
import { utf8 } from './encoding'
import { createTemporaryDirectory } from './files'

export const getRawKey = () => Store.generateRawKey(utf8('00000000000000000000000000000My1'))

let storeDirectory: Promise<string> | undefined

/**
 * The URI of a new SQLite file in a temporary directory, or the store in the URI environment variable (Node.js only),
 * e.g. a Postgres database
 */
export const createStoreUri = async () => {
  const uri = globalThis.process?.env?.URI
  if (uri) return uri

  storeDirectory ??= createTemporaryDirectory()
  return `sqlite://${await storeDirectory}/${Date.now()}-${Math.random().toString(36).slice(2)}.db`
}

export const setupWallet = async () => {
  const key = getRawKey()

  return await Store.provision({
    recreate: true,
    uri: await createStoreUri(),
    keyMethod: new StoreKeyMethod(KdfMethod.Raw),
    passKey: key,
  })
}
