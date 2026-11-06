package foundation.openwallet.askar;

import android.util.Log;
import androidx.annotation.Keep;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings;

@Keep
@DoNotStrip
public class AskarModule extends NativeAskarSpec implements TurboModuleWithJSIBindings {
    static {
        System.loadLibrary("askarreactnative");
    }

    public AskarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    // New Architecture: React Native installs the bindings that this returns when it creates the module
    @DoNotStrip
    @Override
    public native BindingsInstallerHolder getBindingsInstaller();

    private static native void installNative(long jsiRuntimePointer, CallInvokerHolderImpl jsCallInvokerHolder);

    // Old Architecture: install using the runtime of the bridge
    @Override
    public boolean install() {
        try {
            ReactContext context = getReactApplicationContext();
            long jsContextPointer = context.getJavaScriptContextHolder().get();
            CallInvokerHolderImpl holder = (CallInvokerHolderImpl) context.getJSCallInvokerHolder();
            installNative(jsContextPointer, holder);
            return true;
        } catch (Exception exception) {
            Log.e(NAME, "Failed to install JSI Bindings!", exception);
            return false;
        }
    }
}
