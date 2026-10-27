import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// The SQLite files for the tests. files.native.ts does the same in the React Native app

export const createTemporaryDirectory = () => mkdtemp(path.join(os.tmpdir(), 'askar-'))

export const removeDirectory = (directory: string) => rm(directory, { recursive: true, force: true })

/**
 * Copies the Indy SDK wallet in tests/fixtures into the directory, so it can be migrated. Returns the path of the copy
 */
export const copyIndyWallet = async (directory: string) => {
  const walletPath = path.join(directory, 'indy_wallet_sqlite.db')
  await copyFile(path.join(__dirname, '../fixtures/indy_wallet_sqlite.db'), walletPath)
  return walletPath
}
