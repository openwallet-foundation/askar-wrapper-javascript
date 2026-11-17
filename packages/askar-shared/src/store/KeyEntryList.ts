import { NativeAskar } from '../askar'
import type { KeyEntryListHandle } from '../crypto'
import type { KeyEntryObject } from '.'
import { KeyEntry } from './KeyEntry'

export class KeyEntryList {
  private _handle: KeyEntryListHandle
  private _len = 0

  public constructor({ handle, length }: { handle: KeyEntryListHandle; length?: number }) {
    this._handle = handle
    this._len = length ?? NativeAskar.instance.keyEntryListCount({ keyEntryListHandle: handle })
  }

  public get handle() {
    return this._handle
  }

  public get length() {
    return this._len
  }

  public getEntryByIndex(index: number) {
    return new KeyEntry({ list: this.handle, pos: index })
  }

  public forEachKeyEntry(cb: (entry: KeyEntry, index?: number) => unknown) {
    for (let i = 0; i < this.length; i++) {
      cb(this.getEntryByIndex(i), i)
    }
  }

  public toArray(): KeyEntryObject[] {
    const list: KeyEntryObject[] = []
    try {
      this.forEachKeyEntry((key) => list.push(key.toJson()))
    } catch (error) {
      // The caller frees the keys it gets back. When reading fails it gets none, so they're freed here
      for (const entry of list) entry.key.handle.free()
      throw error
    }
    return list
  }
}
