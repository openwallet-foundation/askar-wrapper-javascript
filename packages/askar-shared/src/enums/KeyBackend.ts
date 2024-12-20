import { AskarError } from '../error'

export enum KeyBackend {
  Software = 'software',
  SecureElement = 'secure_element',
}

export const keyBackendFromString = (backend: string): KeyBackend => {
  const keyAlg = Object.entries(KeyBackend).find(([, value]) => value === backend)
  if (keyAlg) return keyAlg[1]

  throw AskarError.customError({ message: `backend: ${backend} is not supported!` })
}

export const keyBackendToString = (alg: KeyBackend): string => {
  const keyAlg = Object.entries(KeyBackend).find(([key]) => key === alg)
  if (keyAlg) return keyAlg[0]

  throw AskarError.customError({ message: `backend: ${alg} is not supported!` })
}
