import assert, { ok } from 'node:assert'
import test, { before, describe } from 'node:test'
import { Argon2, Argon2Algorithm, Argon2Parameters, Argon2Version } from '@openwallet-foundation/askar-shared'
import { setup } from './utils'

describe('Argon2', () => {
  before(setup)

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

  test('derive password matches react-native-argon2 output', () => {
    const password = '000000'
    const salt = '13622169116451511306218218219151372412051474242757211221731116372255771137912226'

    const passwordBytes = Uint8Array.from(Buffer.from(password))
    const saltBytes = Uint8Array.from(Buffer.from(salt))

    const derivedPassword = Argon2.derivePassword(
      {
        algorithm: Argon2Algorithm.Argon2id,
        version: Argon2Version.V0x13,
        parallelism: 4,
        memCost: 64 * 1024,
        timeCost: 8,
      },
      passwordBytes,
      saltBytes
    )

    assert.equal(
      Buffer.from(derivedPassword).toString('hex'),
      '1128133bb2b55a35c801f1dfc99a525cb8ff27a519bcd035f1a07f9a1cf6eae9'
    )
  })
})
