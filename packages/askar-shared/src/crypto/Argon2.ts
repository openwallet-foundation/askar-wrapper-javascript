import { askar } from '../askar'

export enum Argon2Parameters {
  Moderate = 0,
  Interactive = 1,
}

export class Argon2 {
  public static derivePassword(parameters: Argon2Parameters, password: Uint8Array, salt: Uint8Array): Uint8Array {
    return askar.argon2DerivePassword({ parameters, password, salt })
  }
}
