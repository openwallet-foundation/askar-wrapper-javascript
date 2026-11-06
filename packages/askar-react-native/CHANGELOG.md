# @openwallet-foundation/askar-react-native

## 0.7.0

### Minor Changes

- 97808ff: feat: drop the CommonJS build. The packages are now published as ESM only, built with tsdown. This removes the dual package hazard, where a CommonJS and an ESM copy of a package are loaded side by side and `instanceof` checks fail. CommonJS code can still `require()` the packages, which now need Node.js 22.12 or newer
- d9b8fe6: feat: `Store.listOpenSessions`, `Store.listOpenScans` and `keyGetSupportedBackends` on React Native. `keyGetSupportedBackends` is now part of the `Askar` interface that both bindings implement
- ea8840a: Support React Native 0.87 on iOS, and require React Native >= 0.77.

### Patch Changes

- 8d40281: fix(react-native): the native module is now a TurboModule generated with codegen, instead of a legacy module that React Native loads through its interop layer. On the New Architecture, React Native installs the bindings when it creates the module, on iOS and Android. The old architecture keeps working as before
- d9b8fe6: fix(react-native): methods that failed or were missing on React Native now work as on Node.js: `Key.aeadParams`, `Argon2.derivePassword` (it failed with a preset, and returned an `ArrayBuffer` instead of a `Uint8Array`), `Session.updateKey` without an expiry (the key expired right away), `Store.setDefaultProfile`, `Store.listProfiles`, `Store.copyProfile` and `Store.renameProfile`
- 740cdd2: fix: free native memory that leaked. Node.js and React Native now free the strings that Askar returns. React Native frees the state of every async call, and Node.js unregisters the custom logger callback when Askar rejects it. `Store.scan` frees the entry lists it reads, and the `Session` fetch methods free their list when reading it fails. `EcdhEs` and `Ecdh1PU` free the keys they create, also when encrypting or decrypting fails. `Store.copyTo` closes the copy that Askar opens. `askarNodeJS.version()` now returns the version instead of a pointer, and calling `fetchAll` on a `Scan` a second time starts a new scan instead of using the freed one
- 740cdd2: fix(react-native): strings from Askar that aren't ASCII, such as entry names, tags and profile names, are no longer garbled
- Updated dependencies [97808ff]
- Updated dependencies [740cdd2]
- Updated dependencies [94172a7]
- Updated dependencies [740cdd2]
- Updated dependencies [d9b8fe6]
  - @openwallet-foundation/askar-shared@0.7.0

## 0.6.1

### Patch Changes

- 815d768: fix(react-native): install JSI bindings under NewArch (bridgeless)
  - @openwallet-foundation/askar-shared@0.6.1

## 0.6.0

### Minor Changes

- 7be8c93: feat: update to Askar 0.5.0 release.

  - This adds support for providing a custom Argon2 config.

- 2d0270b: Add support for node.js 24 and drop support for node.js 18

### Patch Changes

- 7be8c93: fix: remove references to native secure env library. This was removed in the latest Askar release
- 7be8c93: docs: update version compatibility in readme
- 7be8c93: chore: remove jcenter from gradle. After being deprecated in old gradle versions, with Gradle 9.0.0 jCenter is removed. In order to make the package compatible it is necessary to remove jCenter
- 7be8c93: fix: wrap the askar registration with a `NativeAskar` class that exposes two static members: a `.instance` getter and `register` method.

  Previously when you did not import the native askar library on the first line (or above all logic that uses Askar) the reference to Askar would be undefined. (i.e. askar-shared is imported before askar-react-native or askar-nodejs)

  The `registerAskar` method and `askar` property are kept for backwards compatibility, but these are still prone to the same error. `registerAskar` integrated with the new `NativeAskar` class, and so all usages within the shared library, as well as the nodejs and react-native wrappers will be fixed. We recommend to update to the new `NativeAskar` class for all other usages.

- Updated dependencies [7be8c93]
- Updated dependencies [7be8c93]
- Updated dependencies [2d0270b]
  - @openwallet-foundation/askar-shared@0.6.0

## 0.4.3

### Patch Changes

- 113494f: Added argon2 key derivation
- Updated dependencies [113494f]
  - @openwallet-foundation/askar-shared@0.4.3

## 0.4.2

### Patch Changes

- 3692a12: fix: memory leak from not freeing secret and encrypted buffers
  - @openwallet-foundation/askar-shared@0.4.2

## 0.4.1

### Patch Changes

- 8b46324: feat: support profile renaming and copying
- Updated dependencies [8b46324]
  - @openwallet-foundation/askar-shared@0.4.1

## 0.4.0

### Minor Changes

- 6c40577: The JWK key encoding for BLS keys has been changed to reflect the latest JWK specification for BLS

### Patch Changes

- 2295acb: chore: update to askar version 0.4.5. This release adds support for 16KB page sizes on Android.
- Updated dependencies [6c40577]
  - @openwallet-foundation/askar-shared@0.4.0

## 0.3.2

### Patch Changes

- cb381f0: fix: allow fetching records without category
- Updated dependencies [cb381f0]
  - @openwallet-foundation/askar-shared@0.3.2
