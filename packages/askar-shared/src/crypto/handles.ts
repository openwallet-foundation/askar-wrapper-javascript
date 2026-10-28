import { NativeAskar } from '../askar'
import { AskarError } from '../error'

// A pointer: a BigInt on Node.js, a string on React Native
type ArcHandleType = Uint8Array | string | bigint | null

export class ArcHandle {
  public handle: Uint8Array | string | bigint

  public constructor(handle: Uint8Array | string | bigint) {
    this.handle = handle
  }

  // JSON.stringify throws on BigInts
  public toJSON() {
    return this.handle.toString()
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
    await NativeAskar.instance.storeClose({ storeHandle: this })
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
    NativeAskar.instance.scanFree({ scanHandle: this })
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
    await NativeAskar.instance.sessionClose({ commit, sessionHandle: this })
  }

  public static fromHandle(handle: number | null) {
    return fromSequenceHandle(SessionHandle, handle)
  }
}

export class EntryListHandle extends ArcHandle {
  public getCategory(index: number) {
    return NativeAskar.instance.entryListGetCategory({ index, entryListHandle: this })
  }

  public getName(index: number) {
    return NativeAskar.instance.entryListGetName({ index, entryListHandle: this })
  }

  public getValue(index: number): Uint8Array {
    return NativeAskar.instance.entryListGetValue({ index, entryListHandle: this })
  }

  public getTags(index: number) {
    return NativeAskar.instance.entryListGetTags({ index, entryListHandle: this })
  }

  public free() {
    NativeAskar.instance.entryListFree({ entryListHandle: this })
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(EntryListHandle, handle)
  }
}

export class KeyEntryListHandle extends ArcHandle {
  public getAlgorithm(index: number) {
    return NativeAskar.instance.keyEntryListGetAlgorithm({ index, keyEntryListHandle: this })
  }

  public getName(index: number) {
    return NativeAskar.instance.keyEntryListGetName({ index, keyEntryListHandle: this })
  }

  public getTags(index: number) {
    return NativeAskar.instance.keyEntryListGetTags({ index, keyEntryListHandle: this })
  }

  public getMetadata(index: number) {
    return NativeAskar.instance.keyEntryListGetMetadata({ index, keyEntryListHandle: this })
  }

  public loadKey(index: number) {
    return NativeAskar.instance.keyEntryListLoadLocal({ index, keyEntryListHandle: this })
  }

  public free() {
    NativeAskar.instance.keyEntryListFree({ keyEntryListHandle: this })
  }

  public static fromHandle(handle: ArcHandleType) {
    return fromPointerHandle(KeyEntryListHandle, handle)
  }
}

export class LocalKeyHandle extends ArcHandle {
  public free() {
    NativeAskar.instance.keyFree({ localKeyHandle: this })
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
