import { KdfMethod, LogLevel, Store, StoreKeyMethod, askar, registerAskar } from '@openwallet-foundation/askar-shared'
import { NodeJSAskar } from '../../src/NodeJSAskar'

export const getRawKey = () => Store.generateRawKey(Buffer.from('00000000000000000000000000000My1'))
export const testStoreUri = process.env.URI || 'sqlite://:memory:'

export const setupWallet = async () => {
  const key = getRawKey()

  return await Store.provision({
    recreate: true,
    uri: testStoreUri,
    keyMethod: new StoreKeyMethod(KdfMethod.Raw),
    passKey: key,
  })
}

export const setup = () => {
  registerAskar({ askar: new NodeJSAskar() })
  askar.setDefaultLogger()
}

export const base64url = (str: string) => Buffer.from(str).toString('base64url')
