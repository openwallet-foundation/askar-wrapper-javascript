---
'@openwallet-foundation/askar-react-native': minor
---

Support React Native 0.87 on iOS, and require React Native >= 0.77.

React Native 0.87 removed the legacy bridge, so `RCTCxxBridge` no longer exists and cannot
be named. The old-architecture fallback in `RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)`
referenced it by type, which failed to compile with `Unknown type name 'RCTCxxBridge'`.

That fallback now re-declares the `runtime` accessor it needs and probes for it with
`respondsToSelector:` instead of casting to `RCTCxxBridge`. Only the legacy bridge responds
to it, and on 0.87+ `+[RCTBridge currentBridge]` is hardcoded to return `nil`, so the branch
is simply never taken. Old-architecture apps keep working, with no version detection needed.
On the New Architecture the JSI bindings are still installed via
`installJSIBindingsWithRuntime:callInvoker:`, which is unchanged in 0.87.

The `react-native` peer dependency moves from `>= 0.71` to `>= 0.77` to match what the
module actually supports. This is a documentation fix rather than a removal of working
functionality — React Native < 0.77 has been unsupported in practice since JSI bindings
moved to the TurboModule installation hook:

- `<ReactCommon/RCTTurboModuleWithJSIBindings.h>` does not exist before 0.75, so the module
  could not compile at all.
- 0.75 and 0.76 only declare `installJSIBindingsWithRuntime:` without a call invoker, so the
  implemented `installJSIBindingsWithRuntime:callInvoker:` was never called and `_askar` was
  never installed on `global` under bridgeless mode.

The Android build script also drops its own pinned Android Gradle Plugin 4.2.2 and
`de.undercouch:gradle-download-task` 4.1.2 buildscript classpath (neither is compatible
with the Gradle 9 / AGP 9 toolchain that React Native 0.87 ships) along with the unused
`extractAARHeaders` / `extractJNIFiles` tasks they existed for.
