---
'@openwallet-foundation/askar-nodejs': patch
---

fix(nodejs): free keys, entry lists and key entry lists that are garbage collected without being freed. Keep calling `free()`: this is a safety net that runs whenever the garbage collector does. Use the handle object that Askar returned, and keep it for as long as you use the key or list. Copying its pointer into another handle object is not supported: the key is freed once the original object is collected, and freeing it through the copy frees it twice. `keyGetSupportedBackends` and `Store.listProfiles` now also free their string list when reading it fails
