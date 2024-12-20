import { registerAskar } from '@owf/askar-shared'

import { NodeJSAskar } from './NodeJSAskar'

export const askarNodeJS = new NodeJSAskar()
registerAskar({ askar: askarNodeJS })

export * from '@owf/askar-shared'
