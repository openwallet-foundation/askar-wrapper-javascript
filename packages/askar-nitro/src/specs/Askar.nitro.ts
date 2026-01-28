import type { HybridObject } from 'react-native-nitro-modules'

export interface Askar
  extends HybridObject<{
    ios: 'c++'
    android: 'c++'
  }> {
  version(): string
}
