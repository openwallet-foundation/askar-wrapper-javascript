import { NativeAskar } from '../askar'
import type { EntryListHandle, ScanHandle } from '../crypto'
import type { Entry, EntryObject } from './Entry'
import type { Store } from './Store'

import { askar } from '../askar'
import { AskarError } from '../error'

import { EntryList } from './EntryList'

export class Scan {
  private _handle?: ScanHandle
  private _listHandle?: EntryListHandle
  private store: Store
  private profile?: string
  private category: string
  private tagFilter?: Record<string, unknown>
  private offset?: number
  private limit?: number
  private orderBy?: string
  private descending?: boolean

  public constructor({
    store,
    category,
    limit,
    offset,
    profile,
    tagFilter,
    orderBy,
    descending,
  }: {
    store: Store
    profile?: string
    category: string
    tagFilter?: Record<string, unknown>
    offset?: number
    limit?: number
    orderBy?: string
    descending?: boolean
  }) {
    this.category = category
    this.profile = profile
    this.tagFilter = tagFilter
    this.offset = offset
    this.limit = limit
    this.orderBy = orderBy
    this.descending = descending
    this.store = store
  }

  public get handle() {
    return this._handle
  }

  private async forEachRow(cb: (row: Entry, index?: number) => void) {
    if (!this.handle) {
      if (!this.store?.handle) throw AskarError.customError({ message: 'Cannot scan from closed store' })
      this._handle = await NativeAskar.instance.scanStart({
        storeHandle: this.store.handle,
        profile: this.profile,
        category: this.category,
        tagFilter: this.tagFilter,
        limit: this.limit,
        offset: this.offset,
        orderBy: this.orderBy,
        descending: this.descending,
      })
    }

    if (!this._handle) {
      throw AskarError.customError({ message: 'Handle is not set. Invalid state reached.' })
    }

    try {
      let recordCount = 0
      // Loop while limit not reached (or no limit specified)
      while (!this.limit || recordCount < this.limit) {
        const listHandle = await NativeAskar.instance.scanNext({ scanHandle: this._handle })
        if (!listHandle) break

        this._listHandle = listHandle
        const list = new EntryList({ handle: this._listHandle })

        recordCount = recordCount + list.length
        for (let index = 0; index < list.length; index++) {
          const entry = list.getEntryByIndex(index)
          cb(entry)
        }
      }
    } finally {
      NativeAskar.instance.scanFree({ scanHandle: this._handle })
    }
  }

  public async fetchAll() {
    const rows: EntryObject[] = []
    await this.forEachRow((row) => rows.push(row.toJson()))
    return rows
  }
}
