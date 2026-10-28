import { afterEach } from 'react-native-harness'

// Checks that every test frees what it creates, as on Node.js. A require, so the type check of the example doesn't
// include the shared tests, which are checked for Node.js
require('../../../packages/askar-shared/tests/setup')

// Most askar calls are synchronous, so a test file keeps the JS thread busy from start to end unless it yields.
// Harness drops the app when it doesn't answer its heartbeat in time (120 seconds with the patch in patches/, 20 without),
// so give the event loop a turn after each test
afterEach(() => new Promise((resolve) => setTimeout(resolve, 0)))
