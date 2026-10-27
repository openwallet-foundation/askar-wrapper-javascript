---
'@openwallet-foundation/askar-nodejs': minor
'@openwallet-foundation/askar-react-native': minor
'@openwallet-foundation/askar-shared': minor
---

feat: drop the CommonJS build. The packages are now published as ESM only, built with tsdown. This removes the dual package hazard, where a CommonJS and an ESM copy of a package are loaded side by side and `instanceof` checks fail. CommonJS code can still `require()` the packages on Node.js 22.12 and newer
