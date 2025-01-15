import { registerAskar } from '@openwallet-foundation/askar-shared'
import { NodeJSAskar } from './NodeJSAskar'

export const askarNodeJS = new NodeJSAskar()
registerAskar({ askar: askarNodeJS })

export * from '@openwallet-foundation/askar-shared'
