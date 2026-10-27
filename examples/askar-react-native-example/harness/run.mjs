// Builds the example app, installs it, and runs the React Native Harness tests on one runner:
//
//   node harness/run.mjs <android | ios | android-device | ios-device> [--build-only] [Harness / Jest arguments]
//
// On emulators and simulators Harness boots the device and installs the app itself. Physical devices are detected
// (see devices.mjs), and `expo run` builds, signs and installs the app on them.
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findAndroidDevice, findIosDevice, findIosSimulator, isIosDeviceLocked } from './devices.mjs'

const exampleDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [runner, ...args] = process.argv.slice(2)
const buildOnly = args.includes('--build-only')
const harnessArgs = args.filter((arg) => arg !== '--build-only' && arg !== '--')

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, { cwd: exampleDir, stdio: 'inherit', ...options })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const expo = (...expoArgs) => run('npx', ['expo', ...expoArgs], { env: { ...process.env, EXPO_NO_TELEMETRY: '1' } })

// Like `run`, but also returns the output, while still showing it as it comes. Offline, because after launching on
// an iPhone `expo run:ios` otherwise keeps running with open connections to the Expo servers for development sessions
const runWithOutput = (command, commandArgs) =>
  new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: exampleDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, EXPO_NO_TELEMETRY: '1', EXPO_OFFLINE: '1' },
    })
    let output = ''
    child.stdout.on('data', (data) => {
      output += data
      process.stdout.write(data)
    })
    child.stderr.on('data', (data) => {
      output += data
      process.stderr.write(data)
    })
    child.on('close', (status) => resolve({ status, output }))
  })

const fail = (message) => {
  console.error(`\n${message}\n`)
  process.exit(1)
}

// Harness launches the app, which needs an unlocked device. devicectl sometimes fails while the device is locked, so
// a failed check counts as locked
const waitForUnlockedIosDevice = (device) => {
  const isLocked = () => {
    try {
      return isIosDeviceLocked(device.udid)
    } catch {
      return true
    }
  }
  if (!isLocked()) return

  console.log(`Unlock ${device.name} to continue...`)
  const deadline = Date.now() + 5 * 60 * 1000
  while (isLocked()) {
    if (Date.now() > deadline) fail(`${device.name} stayed locked. Unlock it and run the tests again.`)
    spawnSync('sleep', ['3'])
  }
}

// Builds the debug APK for the emulator's architecture
const buildAndroidEmulatorApp = () => {
  if (!fs.existsSync(path.join(exampleDir, 'android'))) expo('prebuild', '--platform', 'android')

  const abi = process.env.HARNESS_ANDROID_ABI ?? (process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64')
  // The build cache reuses task outputs from earlier builds, in CI too (setup-gradle in ci.yml caches it)
  run('./gradlew', ['assembleDebug', `-PreactNativeArchitectures=${abi}`, '--build-cache'], {
    cwd: path.join(exampleDir, 'android'),
  })
  return path.join(exampleDir, 'android/app/build/outputs/apk/debug/app-debug.apk')
}

// Builds the debug app for the simulator
const buildIosSimulatorApp = () => {
  const iosDir = path.join(exampleDir, 'ios')
  if (!fs.existsSync(iosDir)) expo('prebuild', '--platform', 'ios', '--no-install')
  // CocoaPods fails without a UTF-8 locale, which non-interactive shells often don't set
  run('pod', ['install'], { cwd: iosDir, env: { ...process.env, LANG: process.env.LANG || 'en_US.UTF-8' } })

  const scheme = fs
    .readdirSync(iosDir)
    .find((file) => file.endsWith('.xcworkspace'))
    .replace('.xcworkspace', '')
  run(
    'xcodebuild',
    [
      ...['-workspace', `${scheme}.xcworkspace`, '-scheme', scheme, '-configuration', 'Debug'],
      ...['-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', 'build'],
      ...['-quiet', 'build'],
    ],
    { cwd: iosDir }
  )
  return path.join(iosDir, 'build/Build/Products/Debug-iphonesimulator', `${scheme}.app`)
}

const env = { ...process.env }

if (runner === 'android') {
  env.HARNESS_APP_PATH = buildAndroidEmulatorApp()
} else if (runner === 'ios') {
  const simulator = findIosSimulator()
  if (!simulator) fail('No iPhone simulator found. Install an iOS simulator runtime in Xcode.')
  // Boot it while the app builds: a first boot can take longer than Harness waits for it, on CI runners especially
  spawnSync('xcrun', ['simctl', 'boot', simulator.udid], { stdio: 'ignore' }) // Fails when it's already booted

  env.HARNESS_APP_PATH = buildIosSimulatorApp()

  // Harness only installs the app on a simulator that doesn't have it yet, so install the new build here
  if (!buildOnly) run('xcrun', ['simctl', 'install', simulator.udid, env.HARNESS_APP_PATH])
} else if (runner === 'android-device') {
  const device = findAndroidDevice()
  if (!device) fail('No Android device found. Connect one with USB debugging enabled, and allow this computer on it.')

  console.log(`Running on ${device.manufacturer} ${device.model} (${device.serial})`)
  expo('run:android', '--device', device.name, '--no-bundler')
  env.HARNESS_ANDROID_DEVICE_MANUFACTURER = device.manufacturer
  env.HARNESS_ANDROID_DEVICE_MODEL = device.model
} else if (runner === 'ios-device') {
  const device = findIosDevice()
  if (!device) fail('No iPhone or iPad found. Connect one with a cable, unlock it and trust this Mac.')

  console.log(`Running on ${device.name} (${device.udid})`)

  // Signs with your Apple development certificate, the one used last when there are several. When only launching the
  // app failed because the device locked during the build, the app is installed and Harness launches it below
  const { status, output } = await runWithOutput('npx', ['expo', 'run:ios', '--device', device.udid, '--no-bundler'])
  if (status !== 0 && !output.includes('because the device is locked')) process.exit(status ?? 1)

  waitForUnlockedIosDevice(device)
  env.HARNESS_IOS_DEVICE = device.udid
} else {
  fail('Usage: node harness/run.mjs <android | ios | android-device | ios-device> [--build-only] [arguments]')
}

if (!buildOnly) {
  run('npx', ['react-native-harness', '--harnessRunner', runner, ...harnessArgs], { env })
}
