# Askar Wrapper JavaScript

Wrapper for Node.js and React Native around [https://github.com/openwallet-foundation/askar](askar)

## Setup

You can import all types and classes from the `@openwallet-foundation/askar-nodejs` or `@openwalletfoundation/askar-react-native` library:

```typescript
import { Key, KeyAlgs } from "@openwallet-foundation/askar-nodejs";

const seed = Uint8Array.from(Buffer.from("testseed000000000000000000000001"));
const key = Key.fromSeed({ algorithm: KeyAlgs.Bls12381G1, seed });
```

> **Note**: If you want to use this library in a cross-platform environment you need to import methods from the `@openwallet-foundation/askar-shared` package instead. This is a platform independent package that allows to register the native bindings. The `@openwallet-foundation/askar-nodejs` and `@openwallet-foundation/askar-react-native` packages use this package under the hood. See the [Askar Shared README](https://github.com/openwallet-foundation/askar-wrapper-javascript/tree/main/packages/askar-shared/README.md) for documentation on how to use this package.

## Version Compatibility

The JavaScript wrapper is versioned independently from the native bindings. The following table shows the compatibility between the different versions. This library has been tested with specific Node.JS and React Native versions. Newer or older versions might also work, but they have not been tested.

| JavaScript Wrapper | Askar  | React Native | Node.JS    |
| ------------------ | ------ | ------------ | ---------- |
| v0.3.0 - v0.3.1    | v0.4.1 | -            | -          |
| v0.4.0 - v0.4.2    | v0.4.5 | 0.75 - 0.79  | 18, 20, 22 |
| v0.4.3             | v0.4.6 | 0.75 - 0.79  | 18, 20, 22 |
| v0.5.0             | v0.5.0 | 0.76 - 0.81  | 20, 22, 24 |
