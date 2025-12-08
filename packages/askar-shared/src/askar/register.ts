import { AskarError } from '../error'
import type { Askar } from './Askar'

/**
 * @deprecated use `NativeAskar.instance` instead
 */
export let askar: Askar

export class NativeAskar {
  static #nativeAskar: Askar | undefined

  public static get instance(): Askar {
    if (!NativeAskar.#nativeAskar)
      throw AskarError.customError({
        message:
          "Native askar has not been registered yet. Make sure to import '@openwallet-foundation/askar-nodejs' or '@openwallet-foundation/askar-react-native', or call 'NativeAskar.register' with a custom implementation.",
      })

    return NativeAskar.#nativeAskar
  }

  public static register(nativeAskar: Askar) {
    askar = nativeAskar
    NativeAskar.#nativeAskar = nativeAskar
  }
}

/**
 * @deprecated use `NativeAskar.register` instead
 */
export const registerAskar = (options: { askar: Askar }) => {
  NativeAskar.register(options.askar)
}
