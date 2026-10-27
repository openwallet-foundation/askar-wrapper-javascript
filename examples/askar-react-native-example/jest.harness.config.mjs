export default {
  preset: 'react-native-harness',
  testMatch: ['<rootDir>/tests/**/*.harness.[jt]s?(x)'],
  // Registers the React Native bindings, like packages/askar-nodejs/tests/setup.ts does for Node.js
  setupFiles: ['<rootDir>/harness/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/harness/setupAfterEnv.ts'],
}
