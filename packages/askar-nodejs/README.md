# Askar NodeJS

Wrapper for Nodejs around Askar

## Requirements

This library requires (and has been tested extensively with) Node.js version `18.x`. Newer versions might also work, but they have not been tested.

## Installation

```sh
yarn add @openwallet-foundation/askar-nodejs
```

## Setup

You can import all types and classes from the `@openwallet-foundation/askar-nodejs` library:

```typescript
import { Key, KeyAlgs } from '@openwallet-foundation/askar-nodejs'

const seed = Uint8Array.from(Buffer.from('testseed000000000000000000000001'))
const key = Key.fromSeed({ algorithm: KeyAlgs.Bls12381G1, seed })
```

> **Note**: If you want to use this library in a cross-platform environment you need to import methods from the `@openwallet-foundation/askar-shared` package instead. This is a platform independent package that allows to register the native bindings. The `@openwallet-foundation/askar-nodejs` package uses this package under the hood. See the [Askar Shared README](https://github.com/openwallet-foundation/askar-wrapper-javascript/tree/main/packages/askar-shared/README.md) for documentation on how to use this package.

## Version Compatibility

The JavaScript wrapper is versioned independently from the native bindings. The following table shows the compatibility between the different versions:

| Askar       | JavaScript Wrapper |
| ----------- | ------------------ |
| v0.2.9      | v0.1.x             |
| v0.3.x      | v0.2.x             |
| v0.4.1      | v0.3.x             |
