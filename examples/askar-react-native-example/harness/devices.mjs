import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const output = (command, args) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const adb = () => (process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb') : 'adb')

/**
 * The Android device connected with USB debugging, or the one with serial HARNESS_ANDROID_DEVICE. Emulators are
 * skipped.
 */
export const findAndroidDevice = () => {
  const devices = output(adb(), ['devices', '-l'])
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device' && !serial.startsWith('emulator-'))

  const serial = process.env.HARNESS_ANDROID_DEVICE ?? devices[0]?.[0]
  const device = devices.find(([deviceSerial]) => deviceSerial === serial)
  if (!device) return undefined

  const property = (name) => output(adb(), ['-s', serial, 'shell', 'getprop', name]).trim()
  return {
    serial,
    // `expo run:android --device` finds the device by this name: the model as `adb devices -l` lists it
    name: device.find((info) => info.startsWith('model:'))?.slice('model:'.length) ?? serial,
    manufacturer: property('ro.product.manufacturer'),
    model: property('ro.product.model'),
  }
}

/**
 * An iPhone simulator with the newest iOS version that Xcode has, so the tests run on any Mac and in CI. Set
 * HARNESS_IOS_SIMULATOR (e.g. 'iPhone 16e') and/or HARNESS_IOS_VERSION (e.g. '26.2') to pick another one.
 */
export const findIosSimulator = () => {
  const { devices } = JSON.parse(output('xcrun', ['simctl', 'list', 'devices', 'available', '--json']))
  const wantedName = process.env.HARNESS_IOS_SIMULATOR
  const wantedVersion = process.env.HARNESS_IOS_VERSION

  const runtimes = Object.entries(devices)
    .map(([runtime, runtimeDevices]) => ({ match: runtime.match(/iOS-(\d+)-(\d+)$/), devices: runtimeDevices }))
    .filter(({ match }) => match)
    .map(({ match, devices }) => ({ version: `${match[1]}.${match[2]}`, major: +match[1], minor: +match[2], devices }))
    .filter(({ version }) => !wantedVersion || version === wantedVersion)
    .sort((a, b) => b.major - a.major || b.minor - a.minor)

  for (const runtime of runtimes) {
    const device = runtime.devices.find((device) =>
      wantedName ? device.name === wantedName : device.name.startsWith('iPhone')
    )
    if (device) return { name: device.name, version: runtime.version, udid: device.udid }
  }
  return undefined
}

/**
 * Whether the iPhone or iPad is locked. Apps can't be launched on a locked device.
 */
export const isIosDeviceLocked = (udid) => {
  const jsonFile = path.join(os.tmpdir(), `harness-lockstate-${process.pid}.json`)
  output('xcrun', ['devicectl', 'device', 'info', 'lockState', '--device', udid, '--json-output', jsonFile])
  const { passcodeRequired } = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).result
  fs.rmSync(jsonFile)
  return passcodeRequired
}

/**
 * The iPhone or iPad connected with a cable, else one this Mac is connected to over the network, or the one with the
 * UDID or name in HARNESS_IOS_DEVICE. Paired devices that aren't connected are skipped.
 */
export const findIosDevice = () => {
  const jsonFile = path.join(os.tmpdir(), `harness-devicectl-${process.pid}.json`)
  output('xcrun', ['devicectl', 'list', 'devices', '--json-output', jsonFile])
  const { devices } = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).result
  fs.rmSync(jsonFile)

  const physicalDevices = devices.filter(
    (device) => device.hardwareProperties.reality === 'physical' && device.hardwareProperties.platform === 'iOS'
  )
  const wanted = process.env.HARNESS_IOS_DEVICE
  const device = wanted
    ? physicalDevices.find(
        (device) => device.hardwareProperties.udid === wanted || device.deviceProperties.name === wanted
      )
    : (physicalDevices.find((device) => device.connectionProperties.transportType === 'wired') ??
      physicalDevices.find((device) => device.connectionProperties.tunnelState === 'connected'))

  return device && { udid: device.hardwareProperties.udid, name: device.deviceProperties.name }
}
