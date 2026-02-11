export type AskarErrorObject = {
  code: number
  message: string | null
}

export class AskarError extends Error {
  public readonly code: number

  public constructor({ code, message }: AskarErrorObject) {
    super(message ?? 'No message provided from Askar')
    this.code = code
  }

  public static customError({ message }: { message: string }) {
    return new AskarError({ message, code: 100 })
  }
}

export function handleInvalidNullResponse<T extends null | unknown>(response: T): Exclude<T, null> {
  if (response === null) {
    throw AskarError.customError({ message: 'Invalid response. Expected value but received null' })
  }

  return response as Exclude<T, null>
}
