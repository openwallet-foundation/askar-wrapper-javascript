import { Migration } from '@openwallet-foundation/askar-shared'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { copyIndyWallet, createTemporaryDirectory, removeDirectory } from './utils'

describe('migration', () => {
  let directory: string
  let walletPath: string

  beforeEach(async () => {
    directory = await createTemporaryDirectory()
    walletPath = await copyIndyWallet(directory)
  })

  afterEach(async () => {
    await removeDirectory(directory)
  })

  test('migrate', async () => {
    await expect(
      Migration.migrate({
        specUri: walletPath,
        kdfLevel: 'RAW',
        walletName: 'walletwallet.0',
        walletKey: 'GfwU1DC7gEZNs3w41tjBiZYj7BNToDoFEqKY6wZXqs1A',
      })
    ).resolves.toBeUndefined()

    // Double migrate should not work
    await expect(
      Migration.migrate({
        specUri: walletPath,
        kdfLevel: 'RAW',
        walletName: 'walletwallet.0',
        walletKey: 'GfwU1DC7gEZNs3w41tjBiZYj7BNToDoFEqKY6wZXqs1A',
      })
    ).rejects.toMatchObject({ code: 1, message: 'Database is already migrated' })
  })
})
