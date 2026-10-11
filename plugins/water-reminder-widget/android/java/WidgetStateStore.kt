package __PACKAGE__.widgets

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import org.json.JSONObject
import org.json.JSONArray
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
  val quickAddAmountsMl: List<Int>,
  val remainingMl: Int,
  val themePreference: String,
  val updatedAt: Long
)

object WidgetStateStore {
  private const val preferencesName = "water_reminder_widget"
  private const val stateKey = "state_json"
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
        quickAddAmountsMl = value.optJSONArray("quickAddAmountsMl")?.let { amounts ->
          (0 until amounts.length()).map { amounts.optInt(it) }.filter { it in 1..5000 }.distinct()
        }?.takeIf { it.isNotEmpty() } ?: listOf(250, 500, 750),
        remainingMl = value.optInt("remainingMl", 0),
        themePreference = value.optString("themePreference", "system"),
        updatedAt = value.optLong("updatedAt", System.currentTimeMillis())
      )
    }.getOrNull()
  }

  @Synchronized
  fun write(context: Context, stateJson: String): Boolean {
    // JS owns preferences; a native refresh must not discard a changed glass,
    // goal or theme just because the JS query began before a widget tap.
    // Totals are reconciled from SQLite immediately before rendering.
    requireNotNull(parse(stateJson)) { "Invalid widget state" }

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
      .put("quickAddAmountsMl", JSONArray(state.quickAddAmountsMl))
      .put("remainingMl", state.remainingMl)
      .put("themePreference", state.themePreference)
      .put("updatedAt", state.updatedAt)
      .toString()
  }

}
