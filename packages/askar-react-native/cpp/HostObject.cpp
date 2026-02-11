#include <algorithm>
#include <vector>

#include "HostObject.h"

AskarTurboModuleHostObject::AskarTurboModuleHostObject(
    jsi::Runtime &rt) {
  return;
}
FunctionMap AskarTurboModuleHostObject::functionMapping(jsi::Runtime &rt) {
  FunctionMap fMap;

  fMap.insert(std::make_tuple("version", &askar::version));
  fMap.insert(std::make_tuple("getCurrentError", &askar::getCurrentError));
  fMap.insert(
      std::make_tuple("setDefaultLogger", &askar::setDefaultLogger));

  fMap.insert(
      std::make_tuple("argon2DerivePassword", &askar::argon2DerivePassword));

  fMap.insert(std::make_tuple("storeCopy", &askar::storeCopy));
  fMap.insert(std::make_tuple("storeOpen", &askar::storeOpen));
  fMap.insert(
      std::make_tuple("storeGenerateRawKey", &askar::storeGenerateRawKey));
  fMap.insert(std::make_tuple("storeProvision", &askar::storeProvision));
  fMap.insert(std::make_tuple("storeOpen", &askar::storeOpen));
  fMap.insert(std::make_tuple("storeClose", &askar::storeClose));
  fMap.insert(
      std::make_tuple("storeCreateProfile", &askar::storeCreateProfile));
  fMap.insert(
      std::make_tuple("storeGenerateRawKey", &askar::storeGenerateRawKey));
  fMap.insert(
      std::make_tuple("storeGetProfileName", &askar::storeGetProfileName));
  fMap.insert(
      std::make_tuple("storeGetDefaultProfile",
                      &askar::storeGetDefaultProfile));
  fMap.insert(std::make_tuple("storeProvision", &askar::storeProvision));
  fMap.insert(std::make_tuple("storeRekey", &askar::storeRekey));
  fMap.insert(std::make_tuple("storeRemove", &askar::storeRemove));
  fMap.insert(
      std::make_tuple("storeRemoveProfile", &askar::storeRemoveProfile));
  fMap.insert(
      std::make_tuple("storeSetDefaultProfile",
                      &askar::storeSetDefaultProfile));

  fMap.insert(std::make_tuple("sessionClose", &askar::sessionClose));
  fMap.insert(std::make_tuple("sessionCount", &askar::sessionCount));
  fMap.insert(std::make_tuple("sessionFetch", &askar::sessionFetch));
  fMap.insert(std::make_tuple("sessionFetchAll", &askar::sessionFetchAll));
  fMap.insert(
      std::make_tuple("sessionFetchAllKeys", &askar::sessionFetchAllKeys));
  fMap.insert(std::make_tuple("sessionFetchKey", &askar::sessionFetchKey));
  fMap.insert(
      std::make_tuple("sessionInsertKey", &askar::sessionInsertKey));
  fMap.insert(
      std::make_tuple("sessionRemoveAll", &askar::sessionRemoveAll));
  fMap.insert(
      std::make_tuple("sessionRemoveKey", &askar::sessionRemoveKey));
  fMap.insert(std::make_tuple("sessionStart", &askar::sessionStart));
  fMap.insert(std::make_tuple("sessionUpdate", &askar::sessionUpdate));
  fMap.insert(
      std::make_tuple("sessionUpdateKey", &askar::sessionUpdateKey));

  fMap.insert(
      std::make_tuple("entryListGetName", &askar::entryListGetName));
  fMap.insert(
      std::make_tuple("entryListGetValue", &askar::entryListGetValue));
  fMap.insert(std::make_tuple("entryListGetCategory",
                              &askar::entryListGetCategory));
  fMap.insert(
      std::make_tuple("entryListGetTags", &askar::entryListGetTags));
  fMap.insert(std::make_tuple("entryListCount", &askar::entryListCount));
  fMap.insert(std::make_tuple("entryListFree", &askar::entryListFree));

  fMap.insert(std::make_tuple("scanFree", &askar::scanFree));
  fMap.insert(std::make_tuple("scanNext", &askar::scanNext));
  fMap.insert(std::make_tuple("scanStart", &askar::scanStart));

  fMap.insert(std::make_tuple("keyFromJwk", &askar::keyFromJwk));
  fMap.insert(
      std::make_tuple("keyFromKeyExchange", &askar::keyFromKeyExchange));
  fMap.insert(
      std::make_tuple("keyFromPublicBytes", &askar::keyFromPublicBytes));
  fMap.insert(
      std::make_tuple("keyFromSecretBytes", &askar::keyFromSecretBytes));
  fMap.insert(std::make_tuple("keyFromSeed", &askar::keyFromSeed));
  fMap.insert(std::make_tuple("keyGenerate", &askar::keyGenerate));
  fMap.insert(std::make_tuple("keyGetAlgorithm", &askar::keyGetAlgorithm));
  fMap.insert(std::make_tuple("keyGetEphemeral", &askar::keyGetEphemeral));
  fMap.insert(std::make_tuple("keyGetJwkPublic", &askar::keyGetJwkPublic));
  fMap.insert(std::make_tuple("keyGetJwkSecret", &askar::keyGetJwkSecret));
  fMap.insert(
      std::make_tuple("keyGetJwkThumbprint", &askar::keyGetJwkThumbprint));
  fMap.insert(
      std::make_tuple("keyGetPublicBytes", &askar::keyGetPublicBytes));
  fMap.insert(
      std::make_tuple("keyGetSecretBytes", &askar::keyGetSecretBytes));
  fMap.insert(std::make_tuple("keySignMessage", &askar::keySignMessage));
  fMap.insert(std::make_tuple("keyUnwrapKey", &askar::keyUnwrapKey));
  fMap.insert(
      std::make_tuple("keyVerifySignature", &askar::keyVerifySignature));
  fMap.insert(std::make_tuple("keyWrapKey", &askar::keyWrapKey));

  fMap.insert(std::make_tuple("keyConvert", &askar::keyConvert));
  fMap.insert(std::make_tuple("keyFree", &askar::keyFree));

  fMap.insert(std::make_tuple("keyCryptoBox", &askar::keyCryptoBox));
  fMap.insert(
      std::make_tuple("keyCryptoBoxOpen", &askar::keyCryptoBoxOpen));
  fMap.insert(std::make_tuple("keyCryptoBoxRandomNonce",
                              &askar::keyCryptoBoxRandomNonce));
  fMap.insert(
      std::make_tuple("keyCryptoBoxSeal", &askar::keyCryptoBoxSeal));
  fMap.insert(std::make_tuple("keyCryptoBoxSealOpen",
                              &askar::keyCryptoBoxSealOpen));

  fMap.insert(
      std::make_tuple("keyDeriveEcdh1pu", &askar::keyDeriveEcdh1pu));
  fMap.insert(std::make_tuple("keyDeriveEcdhEs", &askar::keyDeriveEcdhEs));

  fMap.insert(std::make_tuple("keyAeadDecrypt", &askar::keyAeadDecrypt));
  fMap.insert(std::make_tuple("keyAeadEncrypt", &askar::keyAeadEncrypt));
  fMap.insert(
      std::make_tuple("keyAeadGetPadding", &askar::keyAeadGetPadding));
  fMap.insert(
      std::make_tuple("keyAeadGetParams", &askar::keyAeadGetParams));
  fMap.insert(
      std::make_tuple("keyAeadRandomNonce", &askar::keyAeadRandomNonce));

  fMap.insert(
      std::make_tuple("keyEntryListCount", &askar::keyEntryListCount));
  fMap.insert(
      std::make_tuple("keyEntryListFree", &askar::keyEntryListFree));
  fMap.insert(std::make_tuple("keyEntryListGetAlgorithm",
                              &askar::keyEntryListGetAlgorithm));
  fMap.insert(std::make_tuple("keyEntryListGetMetadata",
                              &askar::keyEntryListGetMetadata));
  fMap.insert(
      std::make_tuple("keyEntryListGetName", &askar::keyEntryListGetName));
  fMap.insert(
      std::make_tuple("keyEntryListGetTags", &askar::keyEntryListGetTags));
  fMap.insert(std::make_tuple("keyEntryListLoadLocal",
                              &askar::keyEntryListLoadLocal));

  fMap.insert(std::make_tuple("migrateIndySdk", &askar::migrateIndySdk));

  return fMap;
}

jsi::Function AskarTurboModuleHostObject::call(jsi::Runtime &rt,
                                                    const char *name, Cb cb) {
  return jsi::Function::createFromHostFunction(
      rt, jsi::PropNameID::forAscii(rt, name), 1,
      [this, cb](jsi::Runtime &rt, const jsi::Value &thisValue,
                 const jsi::Value *arguments, size_t count) -> jsi::Value {
        const jsi::Value *val = &arguments[0];
        askarTurboModuleUtility::assertValueIsObject(rt, val);
        return (*cb)(rt, val->getObject(rt));
      });
};

std::vector<jsi::PropNameID>
AskarTurboModuleHostObject::getPropertyNames(jsi::Runtime &rt) {
  auto fMap = AskarTurboModuleHostObject::functionMapping(rt);
  std::vector<jsi::PropNameID> result;
  for (FunctionMap::iterator it = fMap.begin(); it != fMap.end(); ++it) {
    result.push_back(jsi::PropNameID::forUtf8(rt, it->first));
  }

  return result;
}

jsi::Value
AskarTurboModuleHostObject::get(jsi::Runtime &rt,
                                     const jsi::PropNameID &propNameId) {
  auto propName = propNameId.utf8(rt);
  auto fMap = AskarTurboModuleHostObject::functionMapping(rt);
  for (FunctionMap::iterator it = fMap.begin(); it != fMap.end(); ++it) {
    if (it->first == propName) {
      return AskarTurboModuleHostObject::call(rt, it->first, it->second);
    }
  }

  /*
   * https://overreacted.io/why-do-react-elements-have-typeof-property/
   *
   * This is a special React key on the object that `React.createElement()`
   * returns.
   *
   * This function is called under-the-hood to see if this React element is
   * renderable.
   *
   * When we return undefined, instead of `Symbol.for('react.element'), we tell
   * React that this element is not renderable.
   *
   */
  if (propName == "$$typeof")
    return jsi::Value::undefined();

  throw jsi::JSError(rt, "Function: " + propName + " is not defined");
}
