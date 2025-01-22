import { type TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  version: () => string
}

export const turboModuleAskar = () => TurboModuleRegistry.getEnforcing<Spec>('Askar')
