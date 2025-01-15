# Askar React Native

Wrapper for React Native around Askar

## Requirements

This module uses the new React Native Turbo Modules. These are faster than the
previous Native Modules, and can be completely synchronous. A React Native
version of `>= 0.66.0` is required for this package to work.

## Installation

```sh
yarn add @openwallet-foundation/askar-react-native
```

## Setup

You can import all types and classes from the `@openwallet-foundation/askar-react-native` library:

```typescript
import { Key, KeyAlgs } from '@openwallet-foundation/askar-react-native'

const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
const key = Key.fromSeed({ algorithm: KeyAlgs.Bls12381G1, seed })
```

> **Note**: If you want to use this library in a cross-platform environment you need to import methods from the `@openwallet-foundation/askar-shared` package instead. This is a platform independent package that allows to register the native bindings. The `@openwallet-foundation/askar-react-native` package uses this package under the hood. See the [Askar Shared README](https://github.com/openwallet-foundation/askar-wrapper-javascript/tree/main/packages/askar-shared/README.md) for documentation on how to use this package.

## Version Compatibility

The JavaScript wrapper is versioned independently from the native bindings. The following table shows the compatibility between the different versions:

| Askar       | JavaScript Wrapper |
| ----------- | ------------------ |
| v0.2.9      | v0.1.0, v0.1.1     |
| v0.3.1      | v0.2.0             |
