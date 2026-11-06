#include <jni.h>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/BindingsInstallerHolder.h>
#include <ReactCommon/CallInvokerHolder.h>

#include "turboModuleUtility.h"

using namespace facebook;

struct AskarModule : jni::JavaClass<AskarModule> {
public:
  __unused static constexpr auto kJavaDescriptor = "Lfoundation/openwallet/askar/AskarModule;";

  static constexpr auto TAG = "Askar";

  static void registerNatives() {
    javaClassStatic()->registerNatives({
      makeNativeMethod("installNative", AskarModule::installNative),
      makeNativeMethod("getBindingsInstaller", AskarModule::getBindingsInstaller),
    });
  }

private:
  static void installNative(jni::alias_ref<jni::JClass>,
                            jlong jsiRuntimePointer,
                            jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder) {

    auto runtime = reinterpret_cast<jsi::Runtime*>(jsiRuntimePointer);
    auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();

    askarTurboModuleUtility::registerTurboModule(*runtime, jsCallInvoker);
  }

  // React Native calls the installer when it creates the TurboModule, with a valid runtime
  // and call invoker also in bridgeless mode
  static jni::local_ref<react::BindingsInstallerHolder::javaobject> getBindingsInstaller(jni::alias_ref<AskarModule>) {
    return react::BindingsInstallerHolder::newObjectCxxArgs(
        [](jsi::Runtime &runtime, const std::shared_ptr<react::CallInvoker> &callInvoker) {
          askarTurboModuleUtility::registerTurboModule(runtime, callInvoker);
        });
  }
};

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    AskarModule::registerNatives();
  });
}
