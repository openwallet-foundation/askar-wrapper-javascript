const { downloadBinaryIfNeeded } = require('@openwallet-foundation/askar-shared/installBinary')
const { binary } = require('../package.json')
const path = require('path')

downloadBinaryIfNeeded({
  packageName: binary.packageName,
  host: binary.host,
  version: binary.version,
  targetDirectory: path.join(__dirname, '../native'),
})
