import { ok } from 'node:assert'
import { Argon2, Argon2Parameters } from '@openwallet-foundation/askar-shared'
import { describe, test } from 'vitest'

describe('Argon2', () => {
  test('derive password', () => {
    const password = 'my password'
    const salt = 'long enough salt'

    const passwordBytes = Uint8Array.from(Buffer.from(password))
    const saltBytes = Uint8Array.from(Buffer.from(salt))

    const derivedPassword = Argon2.derivePassword(Argon2Parameters.Interactive, passwordBytes, saltBytes)

    ok(
      Buffer.from(derivedPassword).toString('hex') ===
        '9ef87bcf828c46c0136a0d1d9e391d713f75b327c6dc190455bd36c1bae33259'
    )
  })
})
