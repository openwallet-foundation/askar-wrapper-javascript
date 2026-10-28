import { NativeAskar } from '@openwallet-foundation/askar-shared'

import type { NativeBindings } from './NativeBindings'
import { ReactNativeAskar } from './ReactNativeAskar'
import AskarModule from './specs/NativeAskar'

// Reexport everything from shared
export * from '@openwallet-foundation/askar-shared'

// Only calls install() on the old architecture: on the New Architecture, getting the module already installed the
// bindings
if (!('_askar' in globalThis) && !AskarModule.install()) throw Error('Unable to install the turboModule: askar')

// This can already check whether `_askar` exists on global
if (!_askar) {
  throw Error('_askar has not been exposed on global. Something went wrong while installing the turboModule')
}

declare let _askar: NativeBindings

NativeAskar.register(new ReactNativeAskar(_askar))
