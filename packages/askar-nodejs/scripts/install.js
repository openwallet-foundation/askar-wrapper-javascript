const { downloadBinaryIfNeeded } = require('@openwallet-foundation/askar-shared/installBinary')
const { arch, platform: osPlatform } = require('os')
const path = require('path')

const { binary } = require('../package.json')

const archTable = {
  x64: 'x86_64',
  arm64: 'aarch64',
}

const platform = osPlatform()
const targetPlatform = platform === 'win32' ? 'windows' : platform
const targetArchitecture = platform === 'darwin' ? 'universal' : archTable[arch()]
const packageName = binary.packageName.replace('{platform}', targetPlatform).replace('{arch}', targetArchitecture)

downloadBinaryIfNeeded({
  packageName,
  host: binary.host,
  version: binary.version,
  targetDirectory: path.join(__dirname, '../native'),
})
