export const allocatePointer = () => {
  return [undefined] as [unknown]
}

export const allocateStringBuffer = () => {
  return [undefined] as [unknown]
}

export const allocateInt32Buffer = () => {
  return [0] as [number]
}

export const allocateInt8Buffer = () => {
  return [0] as [number]
}

export const allocateSecretBuffer = () => {
  return {} as unknown
}

export const allocateEncryptedBuffer = () => {
  return {} as unknown
}

export const allocateAeadParams = () => {
  return {} as unknown
}

export const allocateLocalKeyHandle = allocatePointer

export const allocateStringListHandle = allocatePointer
