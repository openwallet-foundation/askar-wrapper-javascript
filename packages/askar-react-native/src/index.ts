import type { NativeBindings } from './NativeBindings'
import { registerAskar } from '@owf/askar-shared'
import { NativeModules } from 'react-native'
import { ReactNativeAskar } from './ReactNativeAskar'

export * from '@owf/askar-shared'

const module = NativeModules.Askar as { install: () => boolean }
if (!module.install()) throw Error('Unable to install the turboModule: Askar')

if (!_askar) {
  throw Error('_askar has not been exposed on global. Something went wrong while installing the turboModule')
}

declare let _askar: NativeBindings

registerAskar({ askar: new ReactNativeAskar(_askar) })
