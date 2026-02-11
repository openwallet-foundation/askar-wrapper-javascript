# @openwallet-foundation/askar-nodejs

## 0.6.0

### Minor Changes

- 7be8c93: feat: update to Askar 0.5.0 release.

  - This adds support for providing a custom Argon2 config.

- 2d0270b: Add support for node.js 24 and drop support for node.js 18

### Patch Changes

- 7be8c93: docs: update version compatibility in readme
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
