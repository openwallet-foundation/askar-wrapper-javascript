/**
 * Calls fn until it returns the expected value or the timeout passes, and returns the last value. Harness's expect has
 * no expect.poll
 */
export const poll = async <T>(fn: () => Promise<T>, expected: T, timeoutMs = 2000) => {
  const deadline = Date.now() + timeoutMs
  let value = await fn()
  while (value !== expected && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    value = await fn()
  }
  return value
}
