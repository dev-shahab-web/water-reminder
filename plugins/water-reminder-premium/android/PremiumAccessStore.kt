package __PACKAGE__.premium

import android.content.Context
import org.json.JSONArray

// Only the native billing verifier writes entitlement state. JS preferences,
// config prices and widget snapshots are never accepted as purchase evidence.
object PremiumAccessStore {
  private fun preferences(context: Context) = context.getSharedPreferences("water_reminder_premium", Context.MODE_PRIVATE)
  fun accessUntil(context: Context): Long = preferences(context).getLong("accessUntil", 0)
  fun checkedAt(context: Context): Long = preferences(context).getLong("checkedAt", 0)
  fun isActive(context: Context): Boolean {
    val checkedAt = preferences(context).getLong("checkedAt", 0)
    val now = System.currentTimeMillis()
    return now >= checkedAt && now < accessUntil(context)
  }
  fun productIds(context: Context): List<String> {
    val ids = JSONArray(preferences(context).getString("products", "[]"))
    return (0 until ids.length()).map { ids.getString(it) }
  }
  fun write(context: Context, productIds: List<String>, offlineHours: Int) {
    val now = System.currentTimeMillis()
    check(preferences(context).edit()
      .putLong("checkedAt", now)
      .putLong("accessUntil", if (productIds.isEmpty()) 0 else now + offlineHours.coerceIn(1, 72) * 3_600_000L)
      .putString("products", JSONArray(productIds).toString()).commit())
    __PACKAGE__.wear.PhoneWearSyncWorker.enqueue(context, true)
  }
}
