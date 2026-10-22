package com.shahab.waterreminder.wear.protocol

import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

private fun JSONObject.integer(key: String): Long {
    val value = get(key)
    require(value is Int || value is Long) { "$key must be an integer" }
    return (value as Number).toLong()
}
private fun JSONObject.smallInteger(key: String): Int = integer(key).also {
    require(it in Int.MIN_VALUE.toLong()..Int.MAX_VALUE.toLong())
}.toInt()

object WearProtocol {
    const val VERSION = 1
    const val PREFIX = "/water/v1/"
    const val SNAPSHOT = "${PREFIX}snapshot"
    const val ENTRY = "${PREFIX}entry/"
    const val REQUEST = "${PREFIX}request"
    const val PHONE_CAPABILITY = "water_reminder_phone_v1"
    const val WATCH_CAPABILITY = "water_reminder_watch_v1"
    const val MAX_PENDING = 200
    const val MAX_PAYLOAD = 90_000
    const val OFFLINE_MS = 24 * 60 * 60 * 1000L
    const val MAX_AGE_MS = 30 * OFFLINE_MS

    fun idIsValid(id: String): Boolean = runCatching { UUID.fromString(id).toString() == id }.getOrDefault(false)
    fun dayKey(time: Long, zone: String): String = Instant.ofEpochMilli(time).atZone(ZoneId.of(zone)).toLocalDate().toString()
}

/** One durable desired state per drink. Undo advances its revision; deliveries may reorder. */
data class WearEntry(val id: String, val revision: Int, val amountMl: Int, val timestamp: Long) {
    val deleted get() = revision == 2
    fun json(): JSONObject = JSONObject().put("v", 1).put("id", id).put("revision", revision)
        .put("amountMl", amountMl).put("timestamp", timestamp)

    companion object {
        fun parse(json: JSONObject): WearEntry {
            require(json.smallInteger("v") == WearProtocol.VERSION)
            return WearEntry(json.getString("id"), json.smallInteger("revision"), json.smallInteger("amountMl"), json.integer("timestamp")).also {
                require(WearProtocol.idIsValid(it.id) && it.revision in 1..2 && it.amountMl in 1..5000 && it.timestamp > 0)
            }
        }
    }
}

data class WearReceipt(val id: String, val revision: Int, val status: String) {
    fun json() = JSONObject().put("id", id).put("revision", revision).put("status", status)
}

data class WearPalette(
    val primary: String = "#8DDDD3", val onPrimary: String = "#101816",
    val surface: String = "#192732", val onSurface: String = "#EAF3EF",
    val muted: String = "#8FA59B", val waterTop: String = "#278BA2", val waterBottom: String = "#06465D",
) {
    fun json() = JSONObject().put("primary", primary).put("onPrimary", onPrimary).put("surface", surface)
        .put("onSurface", onSurface).put("muted", muted).put("waterTop", waterTop).put("waterBottom", waterBottom)
    companion object {
        fun parse(value: JSONObject?): WearPalette {
            val fallback = WearPalette()
            fun color(key: String, default: String) = value?.optString(key)?.takeIf { it.matches(Regex("#[0-9a-fA-F]{6}")) } ?: default
            return WearPalette(color("primary", fallback.primary), color("onPrimary", fallback.onPrimary),
                color("surface", fallback.surface), color("onSurface", fallback.onSurface), color("muted", fallback.muted),
                color("waterTop", fallback.waterTop), color("waterBottom", fallback.waterBottom))
        }
    }
}

data class WearSnapshot(
    val generation: String, val revision: Long, val generatedAt: Long,
    val day: String, val zone: String, val consumedMl: Int, val goalMl: Int,
    val unit: String, val presets: List<Int>, val setup: Boolean,
    val accessCheckedAt: Long, val accessUntil: Long,
    val themeId: String, val palette: WearPalette, val reduceMotion: Boolean,
    val receipts: List<WearReceipt> = emptyList(),
) {
    fun hasAccess(now: Long) = accessCheckedAt > 0 && accessUntil > accessCheckedAt && now >= accessCheckedAt && now < accessUntil && accessUntil - accessCheckedAt <= WearProtocol.OFFLINE_MS
    fun totalToday(now: Long) = if (WearProtocol.dayKey(now, zone) == day) consumedMl else 0
    fun json(): JSONObject = JSONObject().put("v", 1).put("generation", generation).put("revision", revision)
        .put("generatedAt", generatedAt).put("day", day).put("zone", zone).put("consumedMl", consumedMl).put("goalMl", goalMl)
        .put("unit", unit).put("presets", JSONArray(presets)).put("setup", setup)
        .put("accessCheckedAt", accessCheckedAt).put("accessUntil", accessUntil)
        .put("themeId", themeId).put("palette", palette.json()).put("reduceMotion", reduceMotion)
        .put("receipts", JSONArray(receipts.map { it.json() }))
    companion object {
        fun parse(json: JSONObject): WearSnapshot {
            require(json.smallInteger("v") == WearProtocol.VERSION)
            val presets = json.getJSONArray("presets")
            val receipts = json.optJSONArray("receipts") ?: JSONArray()
            require(presets.length() in 1..12 && receipts.length() <= 1000)
            return WearSnapshot(json.getString("generation"), json.integer("revision"), json.integer("generatedAt"),
                json.getString("day"), json.getString("zone"), json.smallInteger("consumedMl"), json.smallInteger("goalMl"),
                json.getString("unit"), (0 until presets.length()).map { index ->
                    val amount = presets.get(index)
                    require(amount is Int && amount in 1..5000)
                    amount
                }, json.getBoolean("setup"),
                json.integer("accessCheckedAt"), json.integer("accessUntil"), json.optString("themeId", "default"),
                WearPalette.parse(json.optJSONObject("palette")), json.optBoolean("reduceMotion"),
                (0 until receipts.length()).map {
                    val r = receipts.getJSONObject(it)
                    WearReceipt(r.getString("id"), r.smallInteger("revision"), r.getString("status"))
                }).also {
                require(WearProtocol.idIsValid(it.generation) && it.revision > 0 && it.generatedAt > 0)
                LocalDate.parse(it.day); ZoneId.of(it.zone)
                require(it.day == WearProtocol.dayKey(it.generatedAt, it.zone))
                require(it.consumedMl >= 0 && it.goalMl in 0..20000 && it.unit in listOf("ml", "oz"))
                require(!it.setup || it.goalMl > 0)
                require(it.accessCheckedAt >= 0 && it.accessUntil >= 0)
                require(it.presets.all { amount -> amount in 1..5000 })
                require(it.receipts.all { r -> WearProtocol.idIsValid(r.id) && r.revision in 1..2 && r.status in listOf("accepted", "locked", "invalid", "setup") })
            }
        }
    }
}
