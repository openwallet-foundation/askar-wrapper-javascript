import { Buffer } from 'buffer'

export type JwkProps = {
  kty: string
  crv?: string
  x?: string
  d?: string
  y?: string
  alg?: string
  pub?: string
  priv?: string
}

export class Jwk {
  public kty: string
  public crv?: string
  public x?: string
  public d?: string
  public y?: string
  public alg?: string
  public pub?: string
  public priv?: string

  public constructor({ kty, crv, x, d, y, alg, pub, priv }: JwkProps) {
    this.kty = kty
    this.crv = crv
    this.x = x
    this.d = d
    this.y = y
    this.alg = alg
    this.pub = pub
    this.priv = priv
  }

  public static fromJson(jwk: JwkProps) {
    return new Jwk(jwk)
  }

  public static fromString(str: string) {
    return new Jwk(JSON.parse(str) as JwkProps)
  }

  public toUint8Array(): Uint8Array {
    return Uint8Array.from(Buffer.from(JSON.stringify(this)))
  }
}
