// Encodings for the tests, with APIs that Node.js and React Native (Hermes) both have

export const utf8 = (value: string) => new TextEncoder().encode(value)

export const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

export const fromHex = (value: string) => Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16))

export const base64url = (value: string | Uint8Array) => {
  const bytes = typeof value === 'string' ? utf8(value) : value
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const fromBase64url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0))
