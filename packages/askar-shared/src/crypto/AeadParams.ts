export type AeadParamsOptions = {
  nonceLength: number
  tagLength: number
}

export class AeadParams {
  public nonceLength: number
  public tagLength: number

  public constructor({ nonceLength, tagLength }: AeadParamsOptions) {
    this.nonceLength = nonceLength
    this.tagLength = tagLength
  }
}
