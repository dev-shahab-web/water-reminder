package __PACKAGE__.engagement

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.android.play.core.appupdate.*
import com.google.android.play.core.install.model.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.*

class WaterReminderEngagementModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val updates = AppUpdateManagerFactory.create(context)
  private var updatePromise: Promise? = null
  private var updateTimeout: Job? = null
  private val requestCode = 19450
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, code: Int, result: Int, intent: Intent?) {
      if (code != requestCode) return
      updateTimeout?.cancel()
      updatePromise?.resolve(if (result == Activity.RESULT_OK) "accepted" else if (result == Activity.RESULT_CANCELED) "cancelled" else "failed")
      updatePromise = null
    }
  }
  init { context.addActivityEventListener(listener) }
  override fun getName() = "WaterReminderEngagement"

  private fun run(promise: Promise, block: suspend () -> Unit) {
    scope.launch {
      try { withTimeout(30_000) { block() } }
      catch (error: Exception) { promise.reject("PLAY_UNAVAILABLE", "Google Play could not complete this request.", error) }
    }
  }
  private suspend fun updateInfo(): AppUpdateInfo = suspendCancellableCoroutine { continuation ->
    updates.appUpdateInfo.addOnSuccessListener { if (continuation.isActive) continuation.resume(it) }
      .addOnFailureListener { if (continuation.isActive) continuation.resumeWithException(it) }
  }
  private fun preferences(): WritableMap = Arguments.createMap().apply {
    val prefs = EngagementStore.prefs(context)
    putDouble("firstInstallTime", EngagementStore.firstInstallTime(context).toDouble())
    putBoolean("reviewRemindersEnabled", prefs.getBoolean("reviewEnabled", true))
    putBoolean("updateNotificationsEnabled", prefs.getBoolean("updateNotifications", true))
    putString("reviewStatus", prefs.getString("reviewStatus", "not-confirmed"))
  }

  @ReactMethod
  fun configure(json: String, onboarded: Boolean, promise: Promise) = run(promise) {
    EngagementStore.initialize(context, json, onboarded)
    EngagementStore.reviewIfDue(context)
    promise.resolve(preferences())
  }
  @ReactMethod
  fun setPreferences(reviewEnabled: Boolean, updateNotifications: Boolean, promise: Promise) = run(promise) {
    synchronized(EngagementStore) {
    EngagementStore.prefs(context).edit().putBoolean("reviewEnabled", reviewEnabled).putBoolean("updateNotifications", updateNotifications)
      .apply { if (reviewEnabled) putString("reviewStatus", "not-confirmed") }.apply()
    if (!reviewEnabled) EngagementStore.dismissReview(context)
    if (!updateNotifications) EngagementStore.dismissUpdate(context)
    }
    promise.resolve(preferences())
  }
  @ReactMethod
  fun setReviewResponse(response: String, promise: Promise) = run(promise) {
    require(response in listOf("reviewed", "never", "later", "opened"))
    synchronized(EngagementStore) {
    val edit = EngagementStore.prefs(context).edit().putLong("lastReviewPromptAt", System.currentTimeMillis())
    if (response == "reviewed" || response == "never") edit.putBoolean("reviewEnabled", false).putString("reviewStatus", response)
    edit.apply()
    EngagementStore.dismissReview(context)
    }
    promise.resolve(preferences())
  }
  @ReactMethod
  fun checkUpdate(promise: Promise) = run(promise) {
    val info = updateInfo()
    EngagementStore.updateNotification(context, info)
    val availability = info.updateAvailability()
    val state = when {
      info.installStatus() == InstallStatus.DOWNLOADED -> "downloaded"
      info.installStatus() == InstallStatus.DOWNLOADING || info.installStatus() == InstallStatus.PENDING -> "downloading"
      info.installStatus() == InstallStatus.INSTALLING -> "installing"
      availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS -> "resume"
      availability == UpdateAvailability.UPDATE_AVAILABLE && info.availableVersionCode() > EngagementStore.installedVersion(context) -> "available"
      availability == UpdateAvailability.UPDATE_NOT_AVAILABLE -> "up-to-date"
      else -> "unavailable"
    }
    promise.resolve(Arguments.createMap().apply {
      putString("state", state)
      putInt("versionCode", info.availableVersionCode())
      putDouble("downloadedBytes", info.bytesDownloaded().toDouble())
      putDouble("totalBytes", info.totalBytesToDownload().toDouble())
    })
  }
  @ReactMethod
  fun startUpdate(promise: Promise) = run(promise) {
    if (updatePromise != null) { promise.resolve("in-progress"); return@run }
    val info = updateInfo() // Never reuse an AppUpdateInfo after an attempt.
    if (info.installStatus() == InstallStatus.DOWNLOADED) { promise.resolve("downloaded"); return@run }
    val activity = context.currentActivity ?: throw IllegalStateException("No foreground activity")
    val type = when {
      info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS -> AppUpdateType.IMMEDIATE
      info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> AppUpdateType.FLEXIBLE
      info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) -> AppUpdateType.IMMEDIATE
      else -> { promise.resolve("store"); return@run }
    }
    updatePromise = promise
    try {
      val launched = updates.startUpdateFlowForResult(info, activity, AppUpdateOptions.newBuilder(type).build(), requestCode)
      if (!launched) { updatePromise = null; promise.resolve("store"); return@run }
      EngagementStore.dismissUpdate(context)
      updateTimeout = scope.launch { delay(180_000); updatePromise?.resolve("cancelled"); updatePromise = null }
    } catch (error: Exception) { updatePromise = null; throw error }
  }
  @ReactMethod
  fun completeUpdate(promise: Promise) = run(promise) {
    require(context.currentActivity != null) { "Restart must be requested in the foreground." }
    require(updateInfo().installStatus() == InstallStatus.DOWNLOADED) { "No downloaded update." }
    suspendCancellableCoroutine<Unit> { continuation ->
      updates.completeUpdate().addOnSuccessListener { if (continuation.isActive) continuation.resume(Unit) }
        .addOnFailureListener { if (continuation.isActive) continuation.resumeWithException(it) }
    }
    promise.resolve(null)
  }
  @ReactMethod
  fun openStore(promise: Promise) {
    try {
      val packageName = EngagementStore.config(context)?.optString("playPackage", "__PACKAGE__") ?: "__PACKAGE__"
      try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")).setPackage("com.android.vending").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
      catch (_: Exception) { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$packageName")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("STORE_UNAVAILABLE", "Could not open Google Play.", error) }
  }
  override fun invalidate() {
    context.removeActivityEventListener(listener)
    updatePromise?.resolve("cancelled"); updatePromise = null
    scope.cancel()
    super.invalidate()
  }
}
