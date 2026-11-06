---
'@openwallet-foundation/askar-react-native': patch
---

fix(react-native): the native module is now a TurboModule generated with codegen, instead of a legacy module that React Native loads through its interop layer. On the New Architecture, React Native installs the bindings when it creates the module, on iOS and Android. The old architecture keeps working as before
