import { type TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  // Installs the bindings on the global object as `_askar`. Only needed on the old architecture: on the New
  // Architecture, React Native installs them when it creates the module
  install(): boolean
}

export default TurboModuleRegistry.getEnforcing<Spec>('Askar')
