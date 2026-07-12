package __PACKAGE__.widgets

import android.content.Context
import org.json.JSONObject
import java.util.UUID

data class WidgetState(
  val actionNonce: String,
  val completionPercentage: Int,
  val consumedMl: Int,
  val currentStreak: Int,
  val goalCompleted: Boolean,
  val goalMl: Int,
  val measurementUnit: String,
  val nextReminderAt: Long?,
  val onboardingCompleted: Boolean,
  val remainingMl: Int,
  val themePreference: String,
  val updatedAt: Long
)

object WidgetStateStore {
  private const val preferencesName = "water_reminder_widget"
  private const val stateKey = "state_json"
  private const val processedPrefix = "processed_action_"

  fun read(context: Context): WidgetState? {
    val json = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .getString(stateKey, null)
      ?: return null

    return runCatching {
      val value = JSONObject(json)
      WidgetState(
        actionNonce = value.optString("actionNonce", UUID.randomUUID().toString()),
        completionPercentage = value.optInt("completionPercentage", 0),
        consumedMl = value.optInt("consumedMl", 0),
        currentStreak = value.optInt("currentStreak", 0),
        goalCompleted = value.optBoolean("goalCompleted", false),
        goalMl = value.optInt("goalMl", 0),
        measurementUnit = value.optString("measurementUnit", "ml"),
        nextReminderAt = if (value.isNull("nextReminderAt")) null else value.optLong("nextReminderAt"),
        onboardingCompleted = value.optBoolean("onboardingCompleted", false),
        remainingMl = value.optInt("remainingMl", 0),
        themePreference = value.optString("themePreference", "system"),
        updatedAt = value.optLong("updatedAt", System.currentTimeMillis())
      )
    }.getOrNull()
  }

  fun write(context: Context, stateJson: String) {
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(stateKey, stateJson)
      .apply()
  }

  fun write(context: Context, state: WidgetState) {
    val value = JSONObject()
      .put("actionNonce", state.actionNonce)
      .put("completionPercentage", state.completionPercentage)
      .put("consumedMl", state.consumedMl)
      .put("currentStreak", state.currentStreak)
      .put("goalCompleted", state.goalCompleted)
      .put("goalMl", state.goalMl)
      .put("measurementUnit", state.measurementUnit)
      .put("nextReminderAt", state.nextReminderAt)
      .put("onboardingCompleted", state.onboardingCompleted)
      .put("remainingMl", state.remainingMl)
      .put("themePreference", state.themePreference)
      .put("updatedAt", state.updatedAt)

    write(context, value.toString())
  }

  fun markProcessed(context: Context, actionId: String): Boolean {
    val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    val key = processedPrefix + actionId

    if (preferences.getBoolean(key, false)) {
      return false
    }

    preferences.edit().putBoolean(key, true).apply()
    return true
  }
}
