package __PACKAGE__.engagement

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.*
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import java.util.concurrent.TimeUnit
import org.json.JSONObject

internal object EngagementStore {
  const val WORK = "water-reminder.engagement.check"
  const val REVIEW_CHANNEL = "water-reminder-reviews-v1"
  const val UPDATE_CHANNEL = "water-reminder-updates-v1"
  const val REVIEW_NOTIFICATION = 19451
  const val UPDATE_NOTIFICATION = 19452
  fun prefs(context: Context) = context.getSharedPreferences("water_reminder_engagement", Context.MODE_PRIVATE)
  fun config(context: Context): JSONObject? = runCatching { JSONObject(prefs(context).getString("config", "")!!) }.getOrNull()
  @Suppress("DEPRECATION")
  fun firstInstallTime(context: Context) = context.packageManager.getPackageInfo(context.packageName, 0).firstInstallTime
  @Suppress("DEPRECATION")
  fun installedVersion(context: Context) = context.packageManager.getPackageInfo(context.packageName, 0).longVersionCode

  fun initialize(context: Context, json: String, onboarded: Boolean) {
    val config = JSONObject(json)
    prefs(context).edit().putString("config", json).putBoolean("onboarded", onboarded).apply()
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(REVIEW_CHANNEL, "Review reminders", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Occasional invitations to review Water Reminder."
      setSound(null, null); enableVibration(false); setShowBadge(false)
    })
    manager.createNotificationChannel(NotificationChannel(UPDATE_CHANNEL, "App updates", NotificationManager.IMPORTANCE_DEFAULT).apply {
      description = "New versions and updates ready to install from Google Play."
      setShowBadge(false)
    })
    if (onboarded) {
      val hours = config.getJSONObject("updates").optLong("backgroundCheckHours", 12).coerceIn(6, 24)
      val work = PeriodicWorkRequestBuilder<EngagementWorker>(hours, TimeUnit.HOURS).build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.UPDATE, work)
    } else WorkManager.getInstance(context).cancelUniqueWork(WORK)
  }

  private fun canNotify(context: Context, channel: String): Boolean {
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return false
    val manager = context.getSystemService(NotificationManager::class.java)
    return manager.getNotificationChannel(channel)?.importance?.let { it != NotificationManager.IMPORTANCE_NONE } == true
  }

  private fun post(context: Context, id: Int, channel: String, title: String, body: String, route: String): Boolean {
    if (!canNotify(context, channel)) return false
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("waterreminder://$route"))
      .setClassName(context.packageName, "__PACKAGE__.MainActivity")
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val pending = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val icon = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    val notification = NotificationCompat.Builder(context, channel)
      .setSmallIcon(if (icon != 0) icon else android.R.drawable.ic_dialog_info)
      .setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setContentIntent(pending).setAutoCancel(true).setOnlyAlertOnce(true)
      .setCategory(if (id == UPDATE_NOTIFICATION) NotificationCompat.CATEGORY_STATUS else NotificationCompat.CATEGORY_REMINDER)
      .build()
    return runCatching { NotificationManagerCompat.from(context).notify(id, notification); true }.getOrDefault(false)
  }

  @Synchronized
  fun reviewIfDue(context: Context) {
    val prefs = prefs(context)
    val review = config(context)?.optJSONObject("review") ?: return
    if (!prefs.getBoolean("onboarded", false) || !prefs.getBoolean("reviewEnabled", true) || prefs.getString("reviewStatus", "not-confirmed") == "reviewed") return
    val now = System.currentTimeMillis()
    val first = firstInstallTime(context)
    val firstDays = review.optLong("firstReminderDays", 5).coerceAtLeast(1)
    val repeat = review.optLong("repeatDays", 7).coerceAtLeast(1)
    val last = prefs.getLong("lastReviewPromptAt", 0)
    if (!ReviewCadence.isDue(first, last, now, firstDays, repeat)) return
    if (post(context, REVIEW_NOTIFICATION, REVIEW_CHANNEL, review.getString("title"), review.getString("body"), "feedback"))
      prefs.edit().putLong("lastReviewPromptAt", now).apply()
  }

  @Synchronized
  fun updateNotification(context: Context, info: AppUpdateInfo) {
    val prefs = prefs(context)
    val config = config(context)?.optJSONObject("updates") ?: return
    val version = info.availableVersionCode()
    val available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE || info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
    val downloaded = info.installStatus() == InstallStatus.DOWNLOADED
    if (version <= installedVersion(context) || (!available && !downloaded)) {
      NotificationManagerCompat.from(context).cancel(UPDATE_NOTIFICATION)
      return
    }
    if (!prefs.getBoolean("onboarded", false) || !prefs.getBoolean("updateNotifications", true)) return
    if (info.installStatus() == InstallStatus.DOWNLOADING || info.installStatus() == InstallStatus.PENDING || info.installStatus() == InstallStatus.INSTALLING) return
    val key = if (downloaded) "notifiedDownloadedVersion" else "notifiedUpdateVersion"
    if (prefs.getInt(key, 0) >= version) return
    val title = if (downloaded) "Water Reminder is ready to restart" else config.getString("title")
    val body = if (downloaded) "Your update has downloaded. Open the app to finish updating when you are ready." else config.getString("body")
    if (post(context, UPDATE_NOTIFICATION, UPDATE_CHANNEL, title, body, "updates")) prefs.edit().putInt(key, version).apply()
  }

  fun dismissReview(context: Context) = NotificationManagerCompat.from(context).cancel(REVIEW_NOTIFICATION)
  fun dismissUpdate(context: Context) = NotificationManagerCompat.from(context).cancel(UPDATE_NOTIFICATION)
}
