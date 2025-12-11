import { NativeAskar } from '../askar'

export enum Argon2Parameters {
  Moderate = 0,
  Interactive = 1,
  Custom = -1,
}

export enum Argon2Algorithm {
  Argon2d = 0,
  Argon2i = 1,
  Argon2id = 2,
}

export enum Argon2Version {
  V0x10 = 16,
  V0x13 = 19,
}

export type Argon2Config = {
  algorithm: Argon2Algorithm
  version: Argon2Version
  parallelism: number
  memCost: number
  timeCost: number
}

export class Argon2 {
  public static derivePassword(
    parameters: Argon2Parameters | Argon2Config,
    password: Uint8Array,
    salt: Uint8Array
  ): Uint8Array {
    // If parameters is an object (Argon2Config), use Custom (-1) as parameters
    if (typeof parameters === 'object') {
      return NativeAskar.instance.argon2DerivePassword({
        parameters: Argon2Parameters.Custom,
        password,
        salt,
        config: {
          algorithm: parameters.algorithm,
          version: parameters.version,
          parallelism: parameters.parallelism,
          mem_cost: parameters.memCost,
          time_cost: parameters.timeCost,
        },
      })
    }

    // If parameters is a number, use it directly (no config needed)
    return NativeAskar.instance.argon2DerivePassword({ parameters, password, salt })
  }
}
