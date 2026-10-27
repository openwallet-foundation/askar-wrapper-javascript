---
'@openwallet-foundation/askar-react-native': patch
---

fix(react-native): methods that failed or were missing on React Native now work as on Node.js: `Key.aeadParams`, `Argon2.derivePassword` (it failed with a preset, and returned an `ArrayBuffer` instead of a `Uint8Array`), `Session.updateKey` without an expiry (the key expired right away), `Store.setDefaultProfile`, `Store.listProfiles`, `Store.copyProfile` and `Store.renameProfile`
