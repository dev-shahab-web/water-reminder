package __PACKAGE__.widgets

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.stringPreferencesKey
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
  private const val tag = "WaterReminderWidget"
  private const val preferencesName = "water_reminder_widget"
  private const val stateKey = "state_json"
  private const val processedPrefix = "processed_action_"
  val glanceStateKey = stringPreferencesKey(stateKey)

  fun read(context: Context): WidgetState? {
    return parse(readJson(context))
  }

  fun readJson(context: Context): String? {
    return context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .getString(stateKey, null)
  }

  fun parse(json: String?): WidgetState? {
    if (json == null) {
      return null
    }

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

  fun write(context: Context, stateJson: String): Boolean {
    val incomingState = parse(stateJson)
    val existingState = read(context)

    if (
      incomingState != null &&
      existingState != null &&
      incomingState.updatedAt < existingState.updatedAt
    ) {
      Log.d(
        tag,
        "Skipped stale widget snapshot incomingUpdatedAt=${incomingState.updatedAt} existingUpdatedAt=${existingState.updatedAt}"
      )
      return true
    }

    return context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(stateKey, stateJson)
      .commit()
  }

  fun write(context: Context, state: WidgetState): Boolean {
    return write(context, toJson(state))
  }

  fun toJson(state: WidgetState): String {
    return JSONObject()
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
      .toString()
  }

  fun markProcessed(context: Context, actionId: String): Boolean {
    val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    val key = processedPrefix + actionId

    if (preferences.getBoolean(key, false)) {
      return false
    }

    return preferences.edit().putBoolean(key, true).commit()
  }
}
