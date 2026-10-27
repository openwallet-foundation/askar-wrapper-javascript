import { afterEach } from 'react-native-harness'

// Most askar calls are synchronous, so a test file keeps the JS thread busy from start to end unless it yields.
// Harness drops the app when it doesn't answer its heartbeat in time (120 seconds with the patch in patches/, 20 without),
// so give the event loop a turn after each test
afterEach(() => new Promise((resolve) => setTimeout(resolve, 0)))
