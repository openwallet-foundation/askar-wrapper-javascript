---
'@openwallet-foundation/askar-nodejs': patch
'@openwallet-foundation/askar-react-native': patch
'@openwallet-foundation/askar-shared': patch
---

fix: free native memory that leaked. Node.js and React Native now free the strings that Askar returns. React Native frees the state of every async call, and Node.js unregisters the custom logger callback when Askar rejects it. `Store.scan` frees the entry lists it reads, and the `Session` fetch methods free their list when reading it fails. `EcdhEs` and `Ecdh1PU` free the keys they create, also when encrypting or decrypting fails. `Store.copyTo` closes the copy that Askar opens. `askarNodeJS.version()` now returns the version instead of a pointer, and calling `fetchAll` on a `Scan` a second time starts a new scan instead of using the freed one
