---
'@openwallet-foundation/askar-nodejs': patch
'@openwallet-foundation/askar-shared': patch
---

fix(nodejs): `setCustomLogger` threw a koffi type error and never set the logger, and with `enabled` or `flush` set to `true` it would have crashed the process. Askar expects callbacks for these, not booleans. Both options are now deprecated and have no effect: use `logLevel` to filter the logs
