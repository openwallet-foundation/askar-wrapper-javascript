---
'@openwallet-foundation/askar-react-native': patch
---

fix(react-native): free key entry lists. `keyEntryListFree` counted the list instead of freeing it, so every `Session.fetchKey` and `Session.fetchAllKeys` leaked its list
