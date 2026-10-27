import { Asset } from 'expo-asset'
// Expo SDK 53 only has this API under `next`, which later SDKs keep next to the default export
import { Directory, File, Paths } from 'expo-file-system/next'

// The SQLite files for the tests in the React Native app, like files.ts does on Node.js. Askar takes file paths, Expo
// file URIs: `file:///...` on iOS, `file:/...` on Android

const toPath = (uri: string) => decodeURIComponent(uri.replace(/^file:(\/\/)?/, '')).replace(/\/$/, '')
const toUri = (path: string) => `file://${encodeURI(path)}`

export const createTemporaryDirectory = async () => {
  const directory = new Directory(Paths.cache, `askar-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  directory.create()
  return toPath(directory.uri)
}

export const removeDirectory = async (directory: string) => {
  const expoDirectory = new Directory(toUri(directory))
  if (expoDirectory.exists) expoDirectory.delete()
}

/**
 * Copies the Indy SDK wallet in tests/fixtures into the directory, so it can be migrated. Returns the path of the copy.
 * The wallet is bundled as an asset (metro.config.js adds .db to the asset extensions), which Expo downloads from Metro
 */
export const copyIndyWallet = async (directory: string) => {
  const asset = await Asset.fromModule(require('../fixtures/indy_wallet_sqlite.db')).downloadAsync()
  if (!asset.localUri) throw new Error('Failed to download the Indy wallet fixture')

  const wallet = new File(toUri(directory), 'indy_wallet_sqlite.db')
  // Asynchronous since Expo SDK 58 (synchronous in 53 and 55): on Android the copy is incomplete until it resolves
  await new File(asset.localUri).copy(wallet)
  return toPath(wallet.uri)
}
