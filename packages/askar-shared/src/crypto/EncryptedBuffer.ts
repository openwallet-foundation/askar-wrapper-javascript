export type EncryptedBufferOptions = {
  buffer: Uint8Array
  tagPos: number
  noncePos: number
}

export class EncryptedBuffer {
  private buffer: Uint8Array
  private tagPos: number
  private noncePos: number

  public constructor({ noncePos, tagPos, buffer }: EncryptedBufferOptions) {
    this.buffer = buffer
    this.tagPos = tagPos
    this.noncePos = noncePos
  }

  public get ciphertextWithTag(): Uint8Array {
    const p = this.noncePos
    return this.buffer.slice(0, p)
  }

  public get ciphertext(): Uint8Array {
    const p = this.tagPos
    return this.buffer.slice(0, p)
  }

  public get nonce(): Uint8Array {
    const p = this.noncePos
    return this.buffer.slice(p)
  }

  public get tag(): Uint8Array {
    const p1 = this.tagPos
    const p2 = this.noncePos
    return this.buffer.slice(p1, p2)
  }

  public get parts(): { ciphertext: Uint8Array; tag: Uint8Array; nonce: Uint8Array } {
    return {
      ciphertext: this.ciphertext,
      tag: this.tag,
      nonce: this.nonce,
    }
  }
}
