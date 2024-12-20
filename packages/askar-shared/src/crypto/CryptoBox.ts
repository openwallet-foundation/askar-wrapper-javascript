import type { Key } from './Key'
import { askar } from '../askar'

export class CryptoBox {
  public static randomNonce() {
    return askar.keyCryptoBoxRandomNonce()
  }

  public static cryptoBox({
    recipientKey,
    senderKey,
    message,
    nonce,
  }: {
    recipientKey: Key
    senderKey: Key
    message: Uint8Array
    nonce: Uint8Array
  }) {
    return askar.keyCryptoBox({ nonce, message, senderKey, recipientKey })
  }

  public static open({
    recipientKey,
    senderKey,
    message,
    nonce,
  }: {
    recipientKey: Key
    senderKey: Key
    message: Uint8Array
    nonce: Uint8Array
  }) {
    return askar.keyCryptoBoxOpen({ nonce, message, senderKey, recipientKey })
  }

  public static seal({ recipientKey, message }: { recipientKey: Key; message: Uint8Array }) {
    return askar.keyCryptoBoxSeal({ message, localKeyHandle: recipientKey.handle })
  }

  public static sealOpen({ recipientKey, ciphertext }: { recipientKey: Key; ciphertext: Uint8Array }) {
    return askar.keyCryptoBoxSealOpen({ ciphertext, localKeyHandle: recipientKey.handle })
  }
}
