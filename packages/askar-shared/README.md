# Askar Shared

This package does not contain any functionality, just the classes and types that wrap around the native NodeJS / React Native functionality

## Platform independent setup

If you would like to leverage the Askar libraries for JavaScript in a platform independent way you need to add the `@openwallet-foundation/askar-shared` package to your project. This package exports all public methods.

Before calling any methods you then need to make sure you register the platform specific native bindings. You can do this by importing the platform specific package. You can do this by having separate files that register the package, which allows the React Native bundler to import a different package:

```typescript
// register.ts
import '@openwallet-foundation/askar-nodejs'
```

```typescript
// register.native.ts
import '@openwallet-foundation/askar-react-native'
```

An alterative approach is to first try to require the Node.JS package, and otherwise require the React Native package:

```typescript
try {
  require('@openwallet-foundation/askar-nodejs')
} catch (error) {
  try {
    require('@openwallet-foundation/askar-react-native')
  } catch (error) {
    throw new Error('Could not load Askar bindings')
  }
}
```

How you approach it is up to you, as long as the native binding are called before any actions are performed on the Askar library.

## Version Compatibility

The JavaScript wrapper is versioned independently from the native bindings. The following table shows the compatibility between the different versions:

| Askar       | JavaScript Wrapper |
| ----------- | ------------------ |
| v0.2.9      | v0.1.0, v0.1.1     |
| v0.3.1      | v0.2.0             |
