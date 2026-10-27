#pragma once

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include "HostObject.h"
// TODO(rename): when lib has changed
#include "include/libaries_askar.h"

// Frees the strings that Askar returns. Askar exports it, but libaries_askar.h doesn't declare it
extern "C" void askar_string_free(char *s);

using namespace facebook;

namespace askarTurboModuleUtility {

static const std::string errorPrefix = "Value `";
static const std::string errorInfix = "` is not of type ";

// state of a callback function
struct State {
  jsi::Function cb;
  jsi::Runtime *rt;

  State(jsi::Function *cb_) : cb(std::move(*cb_)) {}
};

// Install the Turbomodule
void registerTurboModule(jsi::Runtime &rt,
                         std::shared_ptr<react::CallInvoker> jsCallInvoker);

// Asserts that a jsi::Value is an object and can be safely transformed
void assertValueIsObject(jsi::Runtime &rt, const jsi::Value *val);

// Converts jsi values to regular cpp values
template <typename T>
T jsiToValue(jsi::Runtime &rt, jsi::Object &options, const char *name,
             bool optional = false);

// Callback function that makes the host function async
void callback(CallbackId result, ErrorCode code);

// Callback function that makes the host function async with response from rust
// side
template <typename T>
void callbackWithResponse(CallbackId result, ErrorCode code, T response);

// Instantiate a return object for JS side.
// ```typescript
// type ReturnObject = {
//   errorCode: number
//   value?: unknown | null
// }
// ```
//
// Value will be defined if there is no error.
// Value will be `null` if there is no value to return
// Value will be undefined if there is an error, e.g. error code != 0
template <typename T>
jsi::Value createReturnValue(jsi::Runtime &rt, ErrorCode code, T out);

jsi::ArrayBuffer byteBufferToArrayBuffer(jsi::Runtime &rt, ByteBuffer bb);
jsi::ArrayBuffer secretBufferToArrayBuffer(jsi::Runtime &rt, SecretBuffer sb);

// Converts a string that Askar returns to a JS string, or null, and frees it
jsi::Value askarStringToValue(jsi::Runtime &rt, const char *value);

// Calls an async Askar function with the callback in `options.cb`. `call` gets
// the callback id to pass on and returns the error code. Askar only calls the
// callback when it returns Success, so otherwise the state is deleted here
template <typename Call>
jsi::Value callAsync(jsi::Runtime &rt, jsi::Object &options, Call call) {
  jsi::Function cb = options.getPropertyAsFunction(rt, "cb");
  State *state = new State(&cb);
  state->rt = &rt;

  ErrorCode code = call(CallbackId(state));
  if (code != ErrorCode::Success)
    delete state;

  return createReturnValue(rt, code, nullptr);
}

} // namespace askarTurboModuleUtility
