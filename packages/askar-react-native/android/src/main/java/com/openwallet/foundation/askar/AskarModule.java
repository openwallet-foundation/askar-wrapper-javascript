package com.openwallet.foundation.askar;

import android.util.Log;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

import id.animo.SecureEnvironment;

@Keep
@DoNotStrip
public class AskarModule extends ReactContextBaseJavaModule {
    static {
        System.loadLibrary("askarreactnative");
    }

    public static final String NAME = "Askar";

    static String TAG = "Askar";

    public AskarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return TAG;
    }

    private static native void installNative(long jsiRuntimePointer, CallInvokerHolderImpl jsCallInvokerHolder);

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean install() {
        try {
            SecureEnvironment.set_env();
            ReactContext context = getReactApplicationContext();
            long jsContextPointer = context.getJavaScriptContextHolder().get();
            CallInvokerHolderImpl holder = (CallInvokerHolderImpl) context.getCatalystInstance().getJSCallInvokerHolder();
            installNative(jsContextPointer, holder);
            return true;
        } catch (Exception exception) {
            Log.e(NAME, "Failed to install JSI Bindings!", exception);
            return false;
        }
    }
}
