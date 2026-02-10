import type { EntryObject } from '.'
import { NativeAskar } from '../askar'
import type { EntryListHandle } from '../crypto'

import { askar } from '../askar'

import { Entry } from './Entry'

export class EntryList {
  private _handle: EntryListHandle
  private _length = 0

  public constructor({ handle, length }: { handle: EntryListHandle; length?: number }) {
    this._handle = handle
    this._length = length ?? NativeAskar.instance.entryListCount({ entryListHandle: handle })
  }

  public get handle() {
    return this._handle
  }

  public get length() {
    return this._length
  }

  public getEntryByIndex(index: number) {
    return new Entry({ list: this.handle, position: index })
  }

  private forEachEntry(cb: (entry: Entry, index?: number) => unknown) {
    for (let i = 0; i < this.length; i++) {
      cb(this.getEntryByIndex(i), i)
    }
  }

  public find(cb: (entry: Entry, index?: number) => boolean): Entry | undefined {
    for (let i = 0; i < this.length; i++) {
      const item = this.getEntryByIndex(i)
      if (cb(item)) return item
    }
  }

  public toArray(valuesAreJson?: boolean): EntryObject[] {
    const list: EntryObject[] = []
    this.forEachEntry((entry) => list.push(entry.toJson(valuesAreJson)))
    return list
  }
}
