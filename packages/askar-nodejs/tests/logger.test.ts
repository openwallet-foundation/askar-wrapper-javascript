import { Key, KeyAlgorithm, LogLevel, NativeAskar } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'

// Askar sets a custom logger once per process. Vitest runs each test file in its own process
describe('custom logger', () => {
  test('logs until cleared', () => {
    const messages: string[] = []

    NativeAskar.instance.setCustomLogger({
      logLevel: LogLevel.Trace,
      // Has no effect, but used to pass a boolean where Askar expects a callback, which crashed the process
      enabled: true,
      flush: true,
      logger: (_context, _level, _target, message) => messages.push(message),
    })
    Key.generate(KeyAlgorithm.Ed25519).handle.free()
    expect(messages).toContain('Generate key: ed25519 for software backend')

    NativeAskar.instance.clearCustomLogger()
    messages.length = 0
    Key.generate(KeyAlgorithm.Ed25519).handle.free()
    expect(messages).toEqual([])

    expect(() => NativeAskar.instance.setCustomLogger({ logLevel: LogLevel.Trace, logger: () => undefined })).toThrow(
      'Repeated logger initialization'
    )
  })
})
