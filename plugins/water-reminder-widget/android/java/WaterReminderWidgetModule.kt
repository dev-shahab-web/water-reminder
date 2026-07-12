package __PACKAGE__.widgets

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class WaterReminderWidgetModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  override fun getName(): String = "WaterReminderWidget"

  @ReactMethod
  fun writeWidgetState(stateJson: String, promise: Promise) {
    try {
      WidgetStateStore.write(reactContext, stateJson)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("WIDGET_STATE_WRITE_FAILED", "Widget state could not be written.", error)
    }
  }

  @ReactMethod
  fun refreshWidgets(promise: Promise) {
    scope.launch {
      try {
        WaterReminderWidget().updateAll(reactContext)
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("WIDGET_REFRESH_FAILED", "Widgets could not be refreshed.", error)
      }
    }
  }
}
