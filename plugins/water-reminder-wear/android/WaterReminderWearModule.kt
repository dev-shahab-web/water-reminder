package __PACKAGE__.wear

import android.content.*
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.*
import com.shahab.waterreminder.wear.protocol.WearProtocol
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await

class WaterReminderWearModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            this@WaterReminderWearModule.context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("wearHydrationChanged", null)
        }
    }
    init {
        val filter = IntentFilter(PhoneWearSyncWorker.ACTION_CHANGED)
        if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else context.registerReceiver(receiver, filter)
    }
    override fun getName() = "WaterReminderWear"
    @ReactMethod fun sync(configuration: String, promise: Promise) {
        scope.launch {
            try { PhoneWearStore.configure(context, configuration); PhoneWearSyncWorker.enqueue(context); promise.resolve(null) }
            catch (_: Exception) { promise.reject("WEAR_SYNC_FAILED", "Watch sync will retry when you reopen the app.") }
        }
    }
    @ReactMethod fun getStatus(promise: Promise) {
        scope.launch {
            try {
                val nodes = Wearable.getCapabilityClient(context).getCapability(WearProtocol.WATCH_CAPABILITY, CapabilityClient.FILTER_REACHABLE).await().nodes
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("available", true); putInt("connectedWatches", nodes.size)
                    putString("watchName", nodes.firstOrNull()?.displayName)
                })
            } catch (_: Exception) { promise.resolve(Arguments.createMap().apply { putBoolean("available", false); putInt("connectedWatches", 0) }) }
        }
    }
    @ReactMethod fun requestSync(promise: Promise) { PhoneWearSyncWorker.enqueue(context, true); promise.resolve(null) }
    @ReactMethod fun addListener(name: String) = Unit
    @ReactMethod fun removeListeners(count: Int) = Unit
    override fun invalidate() { runCatching { context.unregisterReceiver(receiver) }; scope.cancel(); super.invalidate() }
}
