import { NativeAskar } from '@openwallet-foundation/askar-shared'
import { describe, expect, test } from 'vitest'

describe('version', () => {
  test('returns the version of the native library', () => {
    expect(NativeAskar.instance.version()).toMatch(/^\d+\.\d+\.\d+/)
  })
})
