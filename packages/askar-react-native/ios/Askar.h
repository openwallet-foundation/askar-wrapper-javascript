#ifdef RCT_NEW_ARCH_ENABLED
#import <RNAskarSpec/RNAskarSpec.h>

@interface Askar : NSObject <NativeAskarSpec>

@end
#else
#import <React/RCTBridgeModule.h>

@interface Askar : NSObject <RCTBridgeModule>

@end
#endif
