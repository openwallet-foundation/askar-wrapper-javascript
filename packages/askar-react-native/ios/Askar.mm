#import <jsi/jsi.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <askar/turboModuleUtility.h>

#import "Askar.h"

using namespace facebook;

#ifndef RCT_NEW_ARCH_ENABLED
#import <React/RCTBridge+Private.h>

// React Native 0.87 removed the legacy bridge, so `RCTCxxBridge` no longer exists and
// cannot be named. Re-declare just the `runtime` accessor we need and probe for it at
// runtime instead: only the legacy bridge responds to it, and on 0.87+
// `+[RCTBridge currentBridge]` is hardcoded to return nil, so the branch is never taken.
// (`jsCallInvoker` is already declared on RCTBridge by <ReactCommon/RCTTurboModule.h>.)
@interface RCTBridge (AskarLegacyBridge)
- (void *)runtime;
@end
#endif

@interface Askar () <RCTTurboModuleWithJSIBindings>
@end

@implementation Askar

RCT_EXPORT_MODULE()

// React Native calls this when it creates the TurboModule, with a valid runtime and call
// invoker also in bridgeless mode, where [RCTBridge currentBridge] is nil
- (void)installJSIBindingsWithRuntime:(jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<react::CallInvoker> &)callInvoker
{
    askarTurboModuleUtility::registerTurboModule(runtime, callInvoker);
}

#ifdef RCT_NEW_ARCH_ENABLED

- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<react::NativeAskarSpecJSI>(params);
}

// The bindings are already installed by installJSIBindingsWithRuntime:callInvoker:
- (NSNumber *)install
{
    return @YES;
}

#else

// Old Architecture: install using the runtime of the legacy bridge
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
    RCTBridge* bridge = [RCTBridge currentBridge];
    if ([bridge respondsToSelector:@selector(runtime)]) {
        jsi::Runtime* jsiRuntime = (jsi::Runtime*) [bridge runtime];
        if (jsiRuntime != nil) {
            askarTurboModuleUtility::registerTurboModule(*jsiRuntime, bridge.jsCallInvoker);
            return @true;
        }
    }
    return @false;
}

#endif

@end
