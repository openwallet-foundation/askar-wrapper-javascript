import type { StoreHandle } from '../crypto'

import { askar } from '../askar'
import { AskarError } from '../error'

import { Session } from './Session'

export class OpenSession {
  private store: StoreHandle
  private profile?: string
  private isTxn: boolean
  // TODO: implement session
  private session?: Session

  public constructor({ store, isTxn, profile }: { store: StoreHandle; profile?: string; isTxn: boolean }) {
    this.store = store
    this.isTxn = isTxn
    this.profile = profile
  }

  public async open() {
    if (!this.store) throw AskarError.customError({ message: 'Cannot start session from closed store' })
    if (this.session) throw AskarError.customError({ message: 'Session already opened' })
    const sessionHandle = await askar.sessionStart({
      profile: this.profile,
      asTransaction: this.isTxn,
      storeHandle: this.store,
    })
    return new Session({ isTxn: this.isTxn, handle: sessionHandle })
  }
}
