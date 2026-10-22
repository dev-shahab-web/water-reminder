package __PACKAGE__.wear

import android.content.Context
import com.shahab.waterreminder.wear.protocol.*
import org.json.JSONObject
import java.util.UUID

internal object PhoneWearStore {
    private fun prefs(context: Context) = context.getSharedPreferences("water_reminder_wear", Context.MODE_PRIVATE)
    fun configuration(context: Context): JSONObject = runCatching {
        JSONObject(prefs(context).getString("configuration", "{}")!!)
    }.getOrDefault(JSONObject())

    fun configure(context: Context, json: String) {
        require(json.toByteArray().size < 8000)
        val value = JSONObject(json)
        WearPalette.parse(value.optJSONObject("palette"))
        check(prefs(context).edit().putString("configuration", value.toString()).commit())
    }

    @Synchronized fun identity(context: Context): Pair<String, Long> {
        val p = prefs(context)
        val generation = p.getString("generation", null) ?: UUID.randomUUID().toString()
        val revision = p.getLong("revision", 0) + 1
        check(p.edit().putString("generation", generation).putLong("revision", revision).commit())
        return generation to revision
    }
}
