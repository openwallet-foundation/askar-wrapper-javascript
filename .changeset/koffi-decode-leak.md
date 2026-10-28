---
'@openwallet-foundation/askar-nodejs': patch
---

fix: stop leaking about 20 bytes of native memory each time Node.js reads bytes from Askar, such as a signature, a public key, a ciphertext or an entry value. koffi leaked them on every `koffi.decode` call with a length
