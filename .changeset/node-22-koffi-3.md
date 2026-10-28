---
'@openwallet-foundation/askar-nodejs': minor
'@openwallet-foundation/askar-shared': minor
---

feat(nodejs): require Node.js 22 or newer and update koffi to v3. Node.js 20 is end of life. koffi 3 installs its native binary from a package for your platform (`@koromix/koffi-<platform>`) instead of shipping the binaries for all platforms. It also fixes a crash of Node.js 24.14 and newer when exiting after an async Askar call or a custom logger. The native handles of keys and entry lists (`handle.handle`) are now BigInts. `JSON.stringify` writes a handle as a string
