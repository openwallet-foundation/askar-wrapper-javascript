import type { StoreHandle } from '../crypto'
import type { StoreKeyMethod } from './StoreKeyMethod'

import { askar } from '../askar'

import { OpenSession } from './OpenSession'
import { Scan } from './Scan'

export class Store {
  private _handle: StoreHandle
  private _opener?: OpenSession
  private _uri: string

  public constructor({ handle, uri }: { handle: StoreHandle; uri: string }) {
    this._handle = handle
    this._uri = uri
  }

  public get handle() {
    return this._handle
  }

  public static generateRawKey(seed?: Uint8Array) {
    return askar.storeGenerateRawKey({ seed })
  }

  public get uri() {
    return this._uri
  }

  public async createProfile(name?: string) {
    return askar.storeCreateProfile({ storeHandle: this.handle, profile: name })
  }

  public async getDefaultProfile() {
    return askar.storeGetDefaultProfile({ storeHandle: this.handle })
  }

  public async setDefaultProfile(name: string) {
    return askar.storeSetDefaultProfile({ storeHandle: this.handle, profile: name })
  }

  public async listProfiles() {
    return askar.storeListProfiles({ storeHandle: this.handle })
  }

  public async removeProfile(name: string) {
    return await askar.storeRemoveProfile({ profile: name, storeHandle: this.handle })
  }

  public async rekey({ keyMethod, passKey }: { keyMethod?: StoreKeyMethod; passKey: string }) {
    return await askar.storeRekey({ keyMethod: keyMethod?.toUri(), passKey, storeHandle: this.handle })
  }

  public static async provision({
    uri,
    recreate,
    keyMethod,
    passKey,
    profile,
  }: {
    uri: string
    keyMethod?: StoreKeyMethod
    passKey?: string
    profile?: string
    recreate: boolean
  }) {
    const handle = await askar.storeProvision({
      specUri: uri,
      keyMethod: keyMethod?.toUri(),
      profile,
      passKey,
      recreate,
    })
    return new Store({ handle, uri })
  }

  public static async open({
    uri,
    keyMethod,
    passKey,
    profile,
  }: {
    uri: string
    keyMethod?: StoreKeyMethod
    passKey?: string
    profile?: string
  }) {
    const handle = await askar.storeOpen({ profile, passKey, keyMethod: keyMethod?.toUri(), specUri: uri })
    return new Store({ uri, handle })
  }

  public async close(remove = false) {
    this._opener = undefined

    if (this.handle) await this.handle.close()

    return remove ? await Store.remove(this.uri) : false
  }

  public static async remove(uri: string) {
    return await askar.storeRemove({ specUri: uri })
  }

  public session(profile?: string) {
    return new OpenSession({ store: this.handle, profile, isTxn: false })
  }

  public transaction(profile?: string) {
    return new OpenSession({ store: this.handle, profile, isTxn: true })
  }

  public async openSession(isTransaction = false) {
    this._opener ??= new OpenSession({ store: this.handle, isTxn: isTransaction })
    return await this._opener.open()
  }

  public scan(options: {
    category: string
    tagFilter?: Record<string, unknown>
    offset?: number
    limit?: number
    profile?: string
    orderBy?: string
    descending?: boolean
  }) {
    return new Scan({ ...options, store: this })
  }

  public async copyTo({
    uri,
    keyMethod,
    passKey,
    recreate,
  }: {
    uri: string
    keyMethod?: StoreKeyMethod
    passKey?: string
    recreate: boolean
  }) {
    await askar.storeCopyTo({
      storeHandle: this.handle,
      targetUri: uri,
      keyMethod: keyMethod?.toUri(),
      passKey,
      recreate,
    })
  }
}
