import { AskarError, Migration } from '@openwallet-foundation/askar-shared'
import fs from 'node:fs'
import path from 'node:path'
import {describe, test, before, beforeEach} from 'node:test'
import { doesNotReject, rejects } from 'node:assert'
import { setup } from './utils'

const DB_TEMPLATE_PATH = path.join(__dirname, 'indy_wallet_sqlite.db')
const DB_UPGRADE_PATH = path.join(__dirname, 'indy_wallet_sqlite_upgraded.db')

describe('migration', () => {
  before(setup)

  beforeEach(() => {
    const tplPaths = [DB_TEMPLATE_PATH, `${DB_TEMPLATE_PATH}-shm`, `${DB_TEMPLATE_PATH}-wal`]

    const updPaths = [DB_UPGRADE_PATH, `${DB_UPGRADE_PATH}-shm`, `${DB_UPGRADE_PATH}-wal`]

    for (let i = 0; i <= 3; i++) {
      const tplPath = tplPaths[i]
      const updPath = updPaths[i]

      if (fs.existsSync(tplPath)) {
        fs.copyFileSync(tplPath, updPath)
      } else {
        fs.existsSync(updPath) && fs.rmSync(updPath)
      }
    }
  })

  test('migrate', async () => {
    await doesNotReject(() => 
      Migration.migrate({
        specUri: DB_UPGRADE_PATH,
        kdfLevel: 'RAW',
        walletName: 'walletwallet.0',
        walletKey: 'GfwU1DC7gEZNs3w41tjBiZYj7BNToDoFEqKY6wZXqs1A',
      }),
    )

    // Double migrate should not work
    await rejects(() => 
      Migration.migrate({
        specUri: DB_UPGRADE_PATH,
        kdfLevel: 'RAW',
        walletName: 'walletwallet.0',
        walletKey: 'GfwU1DC7gEZNs3w41tjBiZYj7BNToDoFEqKY6wZXqs1A',
      }),
      {code: 1, message: 'Database is already migrated'})
  })
})
