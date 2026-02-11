# @openwallet-foundation/askar-shared

## 0.5.0

### Minor Changes

- 7be8c93: feat: update to Askar 0.5.0 release.

  - This adds support for providing a custom Argon2 config.

### Patch Changes

- 7be8c93: fix: wrap the askar registration with a `NativeAskar` class that exposes two static members: a `.instance` getter and `register` method.

  Previously when you did not import the native askar library on the first line (or above all logic that uses Askar) the reference to Askar would be undefined. (i.e. askar-shared is imported before askar-react-native or askar-nodejs)

  The `registerAskar` method and `askar` property are kept for backwards compatibility, but these are still prone to the same error. `registerAskar` integrated with the new `NativeAskar` class, and so all usages within the shared library, as well as the nodejs and react-native wrappers will be fixed. We recommend to update to the new `NativeAskar` class for all other usages.

## 0.4.3

### Patch Changes

- 113494f: Added argon2 key derivation

## 0.4.2

## 0.4.1

### Patch Changes

- 8b46324: feat: support profile renaming and copying

## 0.4.0

### Minor Changes

- 6c40577: The JWK key encoding for BLS keys has been changed to reflect the latest JWK specification for BLS

## 0.3.2

### Patch Changes

- cb381f0: fix: allow fetching records without category
