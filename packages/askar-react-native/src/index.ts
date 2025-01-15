import type { NativeBindings } from './NativeBindings'

import { registerAskar } from '@openwallet-foundation/askar-shared'
import { NativeModules } from 'react-native'

import { ReactNativeAriesAskar } from './ReactNativeAriesAskar'

// Reexport everything from shared
export * from '@openwallet-foundation/askar-shared'

const module = NativeModules.Askar as { install: () => boolean }
if (!module.install()) throw Error('Unable to install the turboModule: askar')

// This can already check whether `_askar` exists on global
// biome-ignore lint/correctness/noInvalidUseBeforeDeclaration:
if (!_askar) {
  throw Error('_askar has not been exposed on global. Something went wrong while installing the turboModule')
}

declare let _askar: NativeBindings

registerAskar({ askar: new ReactNativeAriesAskar(_askar) })
