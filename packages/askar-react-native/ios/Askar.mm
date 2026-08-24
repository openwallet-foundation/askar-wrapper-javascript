#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/RCTInteropTurboModule.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <askar/turboModuleUtility.h>

#import "Askar.h"

using namespace facebook;

// React Native 0.87 removed the legacy bridge, so `RCTCxxBridge` no longer exists and
// cannot be named. Re-declare just the `runtime` accessor we need and probe for it at
// runtime instead: only the legacy bridge responds to it, and on 0.87+
// `+[RCTBridge currentBridge]` is hardcoded to return nil, so the branch is never taken.
// (`jsCallInvoker` is already declared on RCTBridge by <ReactCommon/RCTTurboModule.h>.)
@interface RCTBridge (AskarLegacyBridge)
- (void *)runtime;
@end

@interface Askar () <RCTTurboModule, RCTTurboModuleWithJSIBindings>
@end

@implementation Askar 

RCT_EXPORT_MODULE()

// Expose this module as a TurboModule so React Native invokes
// installJSIBindingsWithRuntime:callInvoker: below when the module is created.
// This is the only supported way to install JSI bindings under the New
// Architecture / bridgeless mode, where [RCTBridge currentBridge] is nil and
// the legacy bridge is compiled out (RCT_REMOVE_LEGACY_ARCH=1).
//
// ObjCInteropTurboModule keeps the existing RCT_EXPORT methods (e.g. `install`)
// dispatchable without requiring a codegen spec, so this remains a drop-in
// change that also works on the old architecture.
- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<react::ObjCInteropTurboModule>(params);
}

- (void)installJSIBindingsWithRuntime:(jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<react::CallInvoker> &)callInvoker
{
    askarTurboModuleUtility::registerTurboModule(runtime, callInvoker);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
    // New Architecture: the JSI bindings are installed via
    // installJSIBindingsWithRuntime:callInvoker: when this TurboModule is
    // created, so there is nothing to do here.
    //
    // Old Architecture (legacy bridge present): install using the bridge
    // runtime so this keeps working for non-bridgeless apps.
    RCTBridge* bridge = [RCTBridge currentBridge];
    if ([bridge respondsToSelector:@selector(runtime)]) {
        jsi::Runtime* jsiRuntime = (jsi::Runtime*) [bridge runtime];
        if (jsiRuntime != nil) {
            askarTurboModuleUtility::registerTurboModule(*jsiRuntime, bridge.jsCallInvoker);
        }
    }
    return @true;
}

@end
