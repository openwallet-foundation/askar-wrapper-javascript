import { type Askar, NativeAskar } from '@openwallet-foundation/askar-shared'

type Kind = 'key' | 'entry list' | 'key entry list' | 'session' | 'scan' | 'store'

// The methods that create a native resource, and the methods that free it with the option that holds the handle
const created: Partial<Record<keyof Askar, Kind>> = {
  keyConvert: 'key',
  keyDeriveEcdh1pu: 'key',
  keyDeriveEcdhEs: 'key',
  keyEntryListLoadLocal: 'key',
  keyFromJwk: 'key',
  keyFromKeyExchange: 'key',
  keyFromPublicBytes: 'key',
  keyFromSecretBytes: 'key',
  keyFromSeed: 'key',
  keyGenerate: 'key',
  keyUnwrapKey: 'key',
  scanNext: 'entry list',
  sessionFetch: 'entry list',
  sessionFetchAll: 'entry list',
  sessionFetchAllKeys: 'key entry list',
  sessionFetchKey: 'key entry list',
  sessionStart: 'session',
  scanStart: 'scan',
  storeCopyTo: 'store',
  storeOpen: 'store',
  storeProvision: 'store',
}
const freed: Partial<Record<keyof Askar, string>> = {
  keyFree: 'localKeyHandle',
  entryListFree: 'entryListHandle',
  keyEntryListFree: 'keyEntryListHandle',
  sessionClose: 'sessionHandle',
  scanFree: 'scanHandle',
  storeClose: 'storeHandle',
}

/**
 * Wraps the registered native Askar to keep track of the resources that are created and not freed yet, so the tests can
 * check that both the tests and the library free everything they create
 */
export const trackNativeResources = () => {
  const open = new Map<unknown, Kind>()
  const native = NativeAskar.instance

  NativeAskar.register(
    new Proxy(native, {
      get(target, property: keyof Askar) {
        const value = target[property]
        if (typeof value !== 'function') return value

        return (options: Record<string, unknown>) => {
          const freedOption = freed[property]
          if (freedOption) open.delete(options[freedOption])

          const result = (value as (options: unknown) => unknown).call(target, options)
          const kind = created[property]
          if (!kind) return result

          const track = (handle: unknown) => {
            if (handle) open.set(handle, kind)
            return handle
          }
          return result instanceof Promise ? result.then(track) : track(result)
        }
      },
    })
  )

  return {
    /**
     * The kinds of the resources that are still open, and forgets them
     */
    takeOpen: () => {
      const kinds = [...open.values()].sort()
      open.clear()
      return kinds
    },
  }
}
