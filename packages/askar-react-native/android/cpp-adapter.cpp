#include <jni.h>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvokerHolder.h>

#include "turboModuleUtility.h"

using namespace facebook;

struct AskarModule : jni::JavaClass<AskarModule> {
public:
  __unused static constexpr auto kJavaDescriptor = "Lcom/openwallet/foundation/askar/AskarModule;";

  static constexpr auto TAG = "Askar";

  static void registerNatives() {
    javaClassStatic()->registerNatives({ makeNativeMethod("installNative", AskarModule::installNative) });
  }

private:
  static void installNative(jni::alias_ref<jni::JClass>,
                            jlong jsiRuntimePointer,
                            jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {

    auto runtime = reinterpret_cast<jsi::Runtime*>(jsiRuntimePointer);
    auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

    askarTurboModuleUtility::registerTurboModule(*runtime, jsCallInvoker);
  }
};

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    AskarModule::registerNatives();
  });
}
