---
'@openwallet-foundation/askar-react-native': patch
---

fix(react-native): free string lists and byte buffers when reading them fails. An async call that is still running when the app reloads no longer calls back into the new JavaScript runtime with the state of the old one
