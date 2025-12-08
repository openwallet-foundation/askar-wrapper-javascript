import { NativeAskar } from '@openwallet-foundation/askar-shared'
import { NodeJSAskar } from './NodeJSAskar'

export const askarNodeJS = new NodeJSAskar()
NativeAskar.register(askarNodeJS)

export * from '@openwallet-foundation/askar-shared'
