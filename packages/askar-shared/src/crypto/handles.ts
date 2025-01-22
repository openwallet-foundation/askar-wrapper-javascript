import { askar } from '../askar'
import { AskarError } from '../error'

type ArcHandleType = Uint8Array | string | null

export class ArcHandle {
  public handle: Uint8Array | string

  public constructor(handle: Uint8Array | string) {
    if (handle === '0') {
      throw AskarError.customError({
        message: 'Invalid handle. This means that the function call succeeded but none was found.',
      })
    }
    this.handle = handle
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(ArcHandle, handle)
  }
}

export class StoreHandle {
  public handle: number

  public constructor(handle: number) {
    this.handle = handle
  }

  public async close() {
    await askar.storeClose({ storeHandle: this })
  }

  public static fromHandle(handle: number | null) {
    return fromSequenceHandle(StoreHandle, handle)
  }
}

export class ScanHandle {
  public handle: number

  public constructor(handle: number) {
    this.handle = handle
  }

  public free() {
    askar.scanFree({ scanHandle: this })
  }

  public static fromHandle(handle: number | null) {
    return fromSequenceHandle(ScanHandle, handle)
  }
}

export class SessionHandle {
  public handle: number

  public constructor(handle: number) {
    this.handle = handle
  }

  public async close(commit: boolean) {
    await askar.sessionClose({ commit, sessionHandle: this })
  }

  public static fromHandle(handle: number | null) {
    return fromSequenceHandle(SessionHandle, handle)
  }
}

export class EntryListHandle extends ArcHandle {
  public getCategory(index: number) {
    return askar.entryListGetCategory({ index, entryListHandle: this })
  }

  public getName(index: number) {
    return askar.entryListGetName({ index, entryListHandle: this })
  }

  public getValue(index: number) {
    return askar.entryListGetValue({ index, entryListHandle: this })
  }

  public getTags(index: number) {
    return askar.entryListGetTags({ index, entryListHandle: this })
  }

  public free() {
    askar.entryListFree({ entryListHandle: this })
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(EntryListHandle, handle)
  }
}

export class KeyEntryListHandle extends ArcHandle {
  public getAlgorithm(index: number) {
    return askar.keyEntryListGetAlgorithm({ index, keyEntryListHandle: this })
  }

  public getName(index: number) {
    return askar.keyEntryListGetName({ index, keyEntryListHandle: this })
  }

  public getTags(index: number) {
    return askar.keyEntryListGetTags({ index, keyEntryListHandle: this })
  }

  public getMetadata(index: number) {
    return askar.keyEntryListGetMetadata({ index, keyEntryListHandle: this })
  }

  public loadKey(index: number) {
    return askar.keyEntryListLoadLocal({ index, keyEntryListHandle: this })
  }

  public free() {
    askar.keyEntryListFree({ keyEntryListHandle: this })
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(KeyEntryListHandle, handle)
  }
}

export class LocalKeyHandle extends ArcHandle {
  public free() {
    askar.keyFree({ localKeyHandle: this })
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(LocalKeyHandle, handle)
  }
}

/**
 * Instantiate an handle class based on a received handle. If the handle has a value
 * of null, the handle class won't be instantiated but rather null will be returned.
 */
function fromPointerHandle<HC extends typeof ArcHandle, H extends ArcHandleType>(
  HandleClass: HC,
  handle: H
): H extends null ? null : InstanceType<HC> {
  return (handle ? (new HandleClass(handle) as InstanceType<HC>) : null) as H extends null ? null : InstanceType<HC>
}

function fromSequenceHandle<
  HC extends typeof StoreHandle | typeof ScanHandle | typeof SessionHandle,
  H extends number | null,
>(HandleClass: HC, handle: H): InstanceType<HC> {
  if (handle === null) {
    throw AskarError.customError({ message: 'Invalid handle' })
  }

  return new HandleClass(handle) as InstanceType<HC>
}
