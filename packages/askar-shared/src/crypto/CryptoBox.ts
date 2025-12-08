import { NativeAskar } from '../askar'
import type { Key } from './Key'

export class CryptoBox {
  public static randomNonce() {
    return NativeAskar.instance.keyCryptoBoxRandomNonce()
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
    return NativeAskar.instance.keyCryptoBox({ nonce, message, senderKey, recipientKey })
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
    return NativeAskar.instance.keyCryptoBoxOpen({ nonce, message, senderKey, recipientKey })
  }

  public static seal({ recipientKey, message }: { recipientKey: Key; message: Uint8Array }) {
    return NativeAskar.instance.keyCryptoBoxSeal({ message, localKeyHandle: recipientKey.handle })
  }

  public static sealOpen({ recipientKey, ciphertext }: { recipientKey: Key; ciphertext: Uint8Array }) {
    return NativeAskar.instance.keyCryptoBoxSealOpen({ ciphertext, localKeyHandle: recipientKey.handle })
  }
}
