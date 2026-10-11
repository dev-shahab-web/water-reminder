package __PACKAGE__.notifications

import android.app.Notification as AndroidNotification
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.util.Log
import android.widget.RemoteViews
import __PACKAGE__.R
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate

class WaterReminderNotificationsService : NotificationsService() {
  override fun getPresentationDelegate(context: Context): PresentationDelegate =
    WaterReminderPresentationDelegate(context)
}

private class WaterReminderPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  override suspend fun createNotification(
    notification: Notification,
    notificationBehavior: NotificationBehaviorRecord?
  ): AndroidNotification {
    val base = super.createNotification(notification, notificationBehavior)
    val content = notification.notificationRequest.content
    val data = content.body ?: return base
    if (data.optString("type") != "hydration_reminder" || data.optInt("presentationVersion") != 1) return base

    // A rendering failure must never prevent delivery of the standard reminder.
    return try {
      val amount = data.optInt("amountMl", 250).coerceIn(50, 5000)
      val label = data.optString("amountLabel", "$amount mL").take(24)
      val minutes = data.optInt("snoozeMinutes", 10).takeIf { it in listOf(5, 10, 15, 30, 60) } ?: 10
      val illustration = when {
        amount < 180 -> R.drawable.notification_glass_cup
        amount < 280 -> R.drawable.notification_glass_tumbler
        amount < 400 -> R.drawable.notification_glass_mug
        amount < 650 -> R.drawable.notification_glass_tall
        amount < 950 -> R.drawable.notification_glass_bottle
        else -> R.drawable.notification_glass_pitcher
      }
      val drawable = context.getDrawable(illustration)!!
      val bitmap = Bitmap.createBitmap(200, 224, Bitmap.Config.ARGB_8888)
      // Android sizes the large-icon slot itself; inset the artwork to shrink
      // the glass in both collapsed and expanded notifications. Use this one
      // system icon so a second glass cannot squeeze the custom text column.
      drawable.setBounds(25, 28, bitmap.width - 25, bitmap.height - 28)
      drawable.draw(Canvas(bitmap))

      val expanded = RemoteViews(context.packageName, R.layout.water_reminder_notification)
      expanded.setTextViewText(R.id.notification_title, content.title)
      expanded.setTextViewText(R.id.notification_message, content.text)
      expanded.setTextViewText(R.id.notification_capacity, "$label  ·  YOUR GLASS")

      fun action(identifier: String, title: String, foreground: Boolean): AndroidNotification.Action {
        val intent = NotificationsService.createNotificationResponseIntent(
          context, notification, NotificationAction(identifier, title, foreground)
        )
        return AndroidNotification.Action.Builder(null, title, intent).build()
      }
      val actions = mutableListOf(action("water_reminder.reminder.drink", "Log $label", true))
      if (data.optBoolean("snoozeEnabled", true)) {
        actions.add(action("water_reminder.reminder.snooze", "Snooze ${minutes}m", true))
      }
      actions.add(action("water_reminder.reminder.dismiss", "Dismiss", false))

      AndroidNotification.Builder.recoverBuilder(context, base)
        .setColor(Color.rgb(0, 122, 138))
        .setLargeIcon(bitmap)
        .setSubText(if (data.optString("source") == "snoozed") "A fresh start" else "A moment for you")
        .setStyle(AndroidNotification.DecoratedCustomViewStyle())
        .setCustomBigContentView(expanded)
        .setActions(*actions.toTypedArray())
        .build()
    } catch (error: Exception) {
      Log.w("WaterReminder", "Using standard reminder appearance.", error)
      base
    }
  }
}
