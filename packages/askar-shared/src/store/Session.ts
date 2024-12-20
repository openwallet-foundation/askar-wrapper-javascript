import { Buffer } from 'buffer'
import { askar } from '../askar'
import type { Key, SessionHandle } from '../crypto'
import type { KeyAlgorithm } from '../enums'
import { EntryOperation } from '../enums/EntryOperation'
import { AskarError } from '../error'
import { Entry } from './Entry'
import { EntryList } from './EntryList'
import { KeyEntryList } from './KeyEntryList'

export class Session {
  private _handle?: SessionHandle
  private isTxn: boolean

  public constructor({ handle, isTxn }: { handle?: SessionHandle; isTxn: boolean }) {
    this._handle = handle
    this.isTxn = isTxn
  }

  public get isTransaction() {
    return this.isTxn
  }

  public get handle() {
    return this._handle
  }

  public async count({ category, tagFilter }: { category: string; tagFilter?: Record<string, unknown> }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot count from closed session' })
    return await askar.sessionCount({ tagFilter, category, sessionHandle: this.handle })
  }

  public async fetch({
    category,
    name,
    forUpdate = false,
    isJson,
  }: {
    category: string
    name: string
    forUpdate?: boolean
    isJson?: boolean
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot fetch from a closed session' })

    const handle = await askar.sessionFetch({ forUpdate, name, category, sessionHandle: this.handle })
    if (!handle) return null

    const entry = new Entry({ list: handle, position: 0 })
    const entryObject = entry.toJson(isJson)

    handle.free()

    return entryObject
  }

  public async fetchAll({
    category,
    forUpdate = false,
    limit,
    tagFilter,
    isJson,
  }: {
    category: string
    tagFilter?: Record<string, unknown>
    limit?: number
    forUpdate?: boolean
    isJson?: boolean
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot fetch all from a closed session' })
    const handle = await askar.sessionFetchAll({
      forUpdate,
      limit,
      tagFilter,
      sessionHandle: this.handle,
      category,
    })
    if (!handle) return []

    const entryList = new EntryList({ handle })
    const entryObjects = entryList.toArray(isJson)

    entryList.handle.free()

    return entryObjects
  }

  public async insert({
    category,
    name,
    expiryMs,
    tags,
    value,
  }: {
    category: string
    name: string
    value: string | Record<string, unknown>
    tags?: Record<string, unknown>
    expiryMs?: number
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot insert with a closed session' })
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)

    await askar.sessionUpdate({
      value: Uint8Array.from(Buffer.from(serializedValue)),
      expiryMs,
      tags,
      name,
      category,
      sessionHandle: this.handle,
      operation: EntryOperation.Insert,
    })
  }

  public async replace({
    category,
    name,
    expiryMs,
    tags,
    value,
  }: {
    category: string
    name: string
    value: string | Record<string, unknown>
    tags?: Record<string, unknown>
    expiryMs?: number
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot replace with a closed session' })
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)

    await askar.sessionUpdate({
      value: Uint8Array.from(Buffer.from(serializedValue)),
      expiryMs,
      tags,
      name,
      category,
      sessionHandle: this.handle,
      operation: EntryOperation.Replace,
    })
  }

  public async remove({ category, name }: { category: string; name: string }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot remove with a closed session' })

    await askar.sessionUpdate({
      name,
      category,
      sessionHandle: this.handle,
      operation: EntryOperation.Remove,
    })
  }

  public async removeAll({ category, tagFilter }: { category: string; tagFilter?: Record<string, unknown> }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot remove all with a closed session' })

    await askar.sessionRemoveAll({
      category,
      sessionHandle: this.handle,
      tagFilter,
    })
  }

  public async insertKey({
    name,
    key,
    expiryMs,
    metadata,
    tags,
  }: {
    name: string
    key: Key
    metadata?: string
    tags?: Record<string, unknown>
    expiryMs?: number
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot insert a key with a closed session' })

    await askar.sessionInsertKey({
      expiryMs,
      tags,
      metadata,
      name,
      sessionHandle: this.handle,
      localKeyHandle: key.handle,
    })
  }

  public async fetchKey({ name, forUpdate = false }: { name: string; forUpdate?: boolean }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot fetch a key with a closed session' })

    const handle = await askar.sessionFetchKey({ forUpdate, name, sessionHandle: this.handle })
    if (!handle) return null

    const keyEntryList = new KeyEntryList({ handle })
    const keyEntryObject = keyEntryList.getEntryByIndex(0).toJson()
    keyEntryList.handle.free()

    return keyEntryObject
  }

  public async fetchAllKeys({
    forUpdate = false,
    algorithm,
    limit,
    tagFilter,
    thumbprint,
  }: {
    algorithm?: KeyAlgorithm
    thumbprint?: string
    tagFilter?: Record<string, unknown>
    limit?: number
    forUpdate?: boolean
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot fetch all keys with a closed session' })
    const handle = await askar.sessionFetchAllKeys({
      forUpdate,
      limit,
      tagFilter,
      thumbprint,
      algorithm,
      sessionHandle: this.handle,
    })
    if (!handle) return []

    const keyEntryList = new KeyEntryList({ handle })
    const keyEntryObjects = keyEntryList.toArray()
    keyEntryList.handle.free()

    return keyEntryObjects
  }

  public async updateKey({
    name,
    expiryMs,
    metadata,
    tags,
  }: {
    name: string
    metadata?: string
    tags?: Record<string, unknown>
    expiryMs?: number
  }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot update a key with a closed session' })
    await askar.sessionUpdateKey({ expiryMs, tags, metadata, name, sessionHandle: this.handle })
  }

  public async removeKey({ name }: { name: string }) {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot remove a key with a closed session' })
    await askar.sessionRemoveKey({ name, sessionHandle: this.handle })
  }

  /**
   * @note also closes the session
   */
  public async commit() {
    if (!this.isTxn) throw AskarError.customError({ message: 'Session is not a transaction' })
    if (!this.handle) throw AskarError.customError({ message: 'Cannot commit a closed session' })
    await this.handle.close(true)
    this._handle = undefined
  }

  public async rollback() {
    if (!this.isTxn) throw AskarError.customError({ message: 'Session is not a transaction' })
    if (!this.handle) throw AskarError.customError({ message: 'Cannot rollback a closed session' })
    await this.handle.close(false)
    this._handle = undefined
  }

  public async close() {
    if (!this.handle) throw AskarError.customError({ message: 'Cannot close a closed session' })
    await this.handle.close(false)
    this._handle = undefined
  }
}
