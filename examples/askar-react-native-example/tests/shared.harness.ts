// Runs the tests in packages/askar-shared/tests, which also run on Node.js with Vitest. Harness only runs test files
// inside the example (its project root is Jest's rootDir), so this loads all of them. metro.config.js resolves their
// `vitest` import to react-native-harness
const tests = require.context('../../../packages/askar-shared/tests', false, /\.test\.ts$/)
for (const file of tests.keys()) tests(file)
