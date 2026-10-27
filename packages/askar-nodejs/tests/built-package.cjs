// The tests load the packages from src. This loads the build through the exports map, like users do: with require()
// and with import(). Run it after `pnpm build`
const assert = require('node:assert')

const required = require('@openwallet-foundation/askar-nodejs')

import('@openwallet-foundation/askar-nodejs').then((imported) => {
  // require() and import() load the same copy of the package
  assert.strictEqual(required.NativeAskar, imported.NativeAskar)

  console.log(`Loaded Askar ${imported.NativeAskar.instance.version()}`)
})
