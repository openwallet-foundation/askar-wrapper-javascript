import { AskarError } from '../error'

export enum KeyAlgorithm {
  AesA128Gcm = 'a128gcm',
  AesA256Gcm = 'a256gcm',
  AesA128CbcHs256 = 'a128cbchs256',
  AesA256CbcHs512 = 'a256cbchs512',
  AesA128Kw = 'a128kw',
  AesA256Kw = 'a256kw',
  Bls12381G1 = 'bls12381g1',
  Bls12381G2 = 'bls12381g2',
  Chacha20C20P = 'c20p',
  Chacha20XC20P = 'xc20p',
  Ed25519 = 'ed25519',
  X25519 = 'x25519',
  EcSecp256k1 = 'k256',
  EcSecp256r1 = 'p256',
  EcSecp384r1 = 'p384',
}

export const keyAlgorithmFromString = (alg: string): KeyAlgorithm => {
  const keyAlg = Object.entries(KeyAlgorithm).find(([, value]) => value === alg)
  if (keyAlg) return keyAlg[1]

  throw AskarError.customError({ message: `Algorithm: ${alg} is not supported!` })
}

export const keyAlgorithmToString = (alg: KeyAlgorithm): string => {
  const keyAlg = Object.entries(KeyAlgorithm).find(([key]) => key === alg)
  if (keyAlg) return keyAlg[0]

  throw AskarError.customError({ message: `Algorithm: ${alg} is not supported!` })
}
