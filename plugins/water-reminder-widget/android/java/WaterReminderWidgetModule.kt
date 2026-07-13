package __PACKAGE__.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class WaterReminderWidgetModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val tag = "WaterReminderWidget"
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private var listenerCount = 0
  private val widgetChangeReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action != WidgetActionEvents.actionHydrationChanged) {
        return
      }

      val payload = Arguments.createMap().apply {
        putInt("amountMl", intent.getIntExtra(WidgetActionEvents.extraAmountMl, 0))
        putDouble("receivedAt", System.currentTimeMillis().toDouble())
      }

      Log.d(tag, "Emitting widgetHydrationChanged to React Native.")
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("widgetHydrationChanged", payload)
    }
  }

  init {
    val filter = IntentFilter(WidgetActionEvents.actionHydrationChanged)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(widgetChangeReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      reactContext.registerReceiver(widgetChangeReceiver, filter)
    }
  }

  override fun getName(): String = "WaterReminderWidget"

  @ReactMethod
  fun writeWidgetState(stateJson: String, promise: Promise) {
    try {
      val didWrite = WidgetStateStore.write(reactContext, stateJson)
      Log.d(tag, "React Native widget snapshot write completed=$didWrite")
      if (!didWrite) {
        throw IllegalStateException("Widget state commit returned false.")
      }
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("WIDGET_STATE_WRITE_FAILED", "Widget state could not be written.", error)
    }
  }

  @ReactMethod
  fun refreshWidgets(promise: Promise) {
    scope.launch {
      try {
        Log.d(tag, "React Native Glance state sync requested.")
        WaterReminderWidget.syncStateAndUpdate(reactContext, "react_native")
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("WIDGET_REFRESH_FAILED", "Widgets could not be refreshed.", error)
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    listenerCount += 1
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount = (listenerCount - count).coerceAtLeast(0)
  }

  override fun invalidate() {
    runCatching { reactContext.unregisterReceiver(widgetChangeReceiver) }
    super.invalidate()
  }
}
