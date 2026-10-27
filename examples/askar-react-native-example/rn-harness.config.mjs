import { androidEmulator, androidPlatform, physicalAndroidDevice } from '@react-native-harness/platform-android'
import { applePhysicalDevice, applePlatform, appleSimulator } from '@react-native-harness/platform-apple'
import { findIosSimulator } from './harness/devices.mjs'

// Run the tests with `node harness/run.mjs <runner>` (the test:* scripts), which builds and installs the app first

const bundleId = 'foundation.openwallet.askar.example'

const iosSimulator = process.platform === 'darwin' ? findIosSimulator() : undefined

export default {
  entryPoint: './src/index.js',
  appRegistryComponentName: 'main',

  runners: [
    androidPlatform({
      name: 'android',
      // Harness creates the emulator from this config when it doesn't exist yet. Set HARNESS_ANDROID_AVD to use one
      // of your own emulators instead (`emulator -list-avds`)
      device: androidEmulator(process.env.HARNESS_ANDROID_AVD ?? 'Harness_API_35', {
        apiLevel: 35,
        profile: 'pixel_6',
        diskSize: '2G',
        heapSize: '1G',
      }),
      bundleId,
    }),
    ...(iosSimulator
      ? [
          applePlatform({
            name: 'ios',
            // The newest iPhone simulator, see findIosSimulator
            device: appleSimulator(iosSimulator.name, iosSimulator.version),
            bundleId,
          }),
        ]
      : []),
    // harness/run.mjs detects the connected device and sets these
    ...(process.env.HARNESS_ANDROID_DEVICE_MODEL
      ? [
          androidPlatform({
            name: 'android-device',
            device: physicalAndroidDevice(
              process.env.HARNESS_ANDROID_DEVICE_MANUFACTURER,
              process.env.HARNESS_ANDROID_DEVICE_MODEL
            ),
            bundleId,
          }),
        ]
      : []),
    ...(process.env.HARNESS_IOS_DEVICE
      ? [applePlatform({ name: 'ios-device', device: applePhysicalDevice(process.env.HARNESS_IOS_DEVICE), bundleId })]
      : []),
  ],

  // Deriving keys with Argon2 takes a few seconds on emulators
  testTimeout: 60000,
}
