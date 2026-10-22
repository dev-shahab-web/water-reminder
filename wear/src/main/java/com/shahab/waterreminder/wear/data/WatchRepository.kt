package com.shahab.waterreminder.wear.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.os.SystemClock
import com.shahab.waterreminder.wear.protocol.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.UUID

data class LocalDrink(val entry: WearEntry, val pending: Boolean, val acceptedRevision: Int, val error: String?, val cleaned: Boolean = false)
data class WatchState(val snapshot: WearSnapshot?, val drinks: List<LocalDrink>, val phoneId: String?, val receivedAt: Long) {
    val pendingCount get() = drinks.count { it.pending }
    fun total(now: Long): Int {
        val s = snapshot ?: return 0
        return (s.totalToday(now) + drinks.filter {
            it.pending && it.error != "invalid" && WearProtocol.dayKey(it.entry.timestamp, s.zone) == WearProtocol.dayKey(now, s.zone)
        }.sumOf {
            if (!it.entry.deleted && it.acceptedRevision == 0) it.entry.amountMl
            else if (it.entry.deleted && it.acceptedRevision == 1) -it.entry.amountMl else 0
        }).coerceAtLeast(0)
    }
}

/** Small transactional outbox. A tap is durable before any confirmation is shown. */
class WatchRepository internal constructor(context: Context, name: String = "water_watch.db") : SQLiteOpenHelper(context, name, null, 2) {
    private val changes = MutableStateFlow(WatchState(null, emptyList(), null, 0))
    val state = changes.asStateFlow()
    init { setWriteAheadLoggingEnabled(true) }
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)")
        db.execSQL("CREATE TABLE drinks (id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL, amount INTEGER NOT NULL, timestamp INTEGER NOT NULL, pending INTEGER NOT NULL, accepted INTEGER NOT NULL DEFAULT 0, error TEXT, cleaned INTEGER NOT NULL DEFAULT 0)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) db.execSQL("ALTER TABLE drinks ADD COLUMN cleaned INTEGER NOT NULL DEFAULT 0")
    }

    private fun meta(key: String): String? = readableDatabase.rawQuery("SELECT value FROM metadata WHERE key=?", arrayOf(key)).use { if (it.moveToFirst()) it.getString(0) else null }
    private fun put(key: String, value: String) = writableDatabase.execSQL("INSERT OR REPLACE INTO metadata(key,value) VALUES (?,?)", arrayOf(key, value))

    @Synchronized fun reload() {
        val snapshot = meta("snapshot")?.let { runCatching { WearSnapshot.parse(JSONObject(it)) }.getOrNull() }
        val drinks = mutableListOf<LocalDrink>()
        readableDatabase.rawQuery("SELECT id,revision,amount,timestamp,pending,accepted,error,cleaned FROM drinks ORDER BY timestamp DESC", null).use {
            while (it.moveToNext()) drinks.add(LocalDrink(WearEntry(it.getString(0), it.getInt(1), it.getInt(2), it.getLong(3)), it.getInt(4) != 0, it.getInt(5), if (it.isNull(6)) null else it.getString(6), it.getInt(7) != 0))
        }
        changes.value = WatchState(snapshot, drinks, meta("phone"), meta("receivedAt")?.toLongOrNull() ?: 0)
    }

    @Synchronized fun hasAccess(now: Long = System.currentTimeMillis()): Boolean {
        val s = state.value.snapshot ?: return false
        if (!s.setup || !s.hasAccess(now)) return false
        val receivedAt = meta("receivedAt")?.toLongOrNull() ?: return false
        val bootWall = meta("bootWall")?.toLongOrNull() ?: return false
        val deadline = meta("deadlineElapsed")?.toLongOrNull() ?: return false
        // A wall-clock rollback cannot prolong a verified offline window. After
        // reboot, require a fresh phone snapshot instead of trusting reset uptime.
        if (kotlin.math.abs((now - SystemClock.elapsedRealtime()) - bootWall) > 60_000) return false
        return now >= receivedAt && SystemClock.elapsedRealtime() < deadline
    }

    @Synchronized fun add(amount: Int, now: Long = System.currentTimeMillis()): WearEntry {
        check(hasAccess(now)) { "Open your phone to verify Plus." }
        require(amount in 1..5000)
        check(state.value.pendingCount < WearProtocol.MAX_PENDING) { "Connect your phone to sync saved drinks first." }
        val entry = WearEntry(UUID.randomUUID().toString(), 1, amount, now)
        writableDatabase.execSQL("INSERT INTO drinks(id,revision,amount,timestamp,pending,accepted) VALUES (?,1,?,?,1,0)", arrayOf<Any>(entry.id, amount, now))
        reload()
        return entry
    }

    @Synchronized fun undo(id: String) {
        val drink = state.value.drinks.firstOrNull { it.entry.id == id } ?: return
        if (drink.entry.deleted) return
        writableDatabase.execSQL("UPDATE drinks SET revision=2,pending=1,error=NULL,cleaned=0 WHERE id=?", arrayOf(id))
        reload()
    }

    @Synchronized fun markCleaned(id: String, revision: Int) {
        writableDatabase.execSQL("UPDATE drinks SET cleaned=1 WHERE id=? AND revision=? AND pending=0", arrayOf<Any>(id, revision))
    }

    @Synchronized fun prune(now: Long = System.currentTimeMillis()) {
        writableDatabase.execSQL("DELETE FROM drinks WHERE pending=0 AND cleaned=1 AND timestamp<?", arrayOf(now - WearProtocol.MAX_AGE_MS))
        reload()
    }

    @Synchronized fun accept(snapshot: WearSnapshot, phone: String) {
        val previous = state.value.snapshot
        if (state.value.phoneId != null && state.value.phoneId != phone) return
        if (previous?.generation == snapshot.generation && previous.revision >= snapshot.revision) return
        val now = System.currentTimeMillis()
        if (snapshot.generatedAt > now + 300_000) return
        if (previous != null && previous.generation != snapshot.generation && snapshot.generatedAt < previous.generatedAt) return
        val elapsed = SystemClock.elapsedRealtime()
        val db = writableDatabase
        db.beginTransaction()
        try {
            put("snapshot", snapshot.json().toString())
            put("phone", phone)
            put("receivedAt", now.toString())
            put("bootWall", (now - elapsed).toString())
            val remaining = (snapshot.accessUntil - maxOf(now, snapshot.generatedAt)).coerceIn(0, WearProtocol.OFFLINE_MS)
            put("deadlineElapsed", (elapsed + remaining).toString())
            for (receipt in snapshot.receipts) {
                if (receipt.status == "accepted") {
                    db.execSQL("UPDATE drinks SET accepted=MAX(accepted,?), pending=CASE WHEN revision<=? THEN 0 ELSE pending END, error=NULL WHERE id=?", arrayOf<Any>(receipt.revision, receipt.revision, receipt.id))
                } else {
                    db.execSQL("UPDATE drinks SET error=?,pending=CASE WHEN ?='invalid' THEN 0 ELSE pending END WHERE id=? AND revision<=?", arrayOf<Any>(receipt.status, receipt.status, receipt.id, receipt.revision))
                }
            }
            db.setTransactionSuccessful()
        } finally { db.endTransaction() }
        reload()
    }

    companion object {
        @Volatile private var instance: WatchRepository? = null
        fun get(context: Context): WatchRepository = instance ?: synchronized(this) {
            instance ?: WatchRepository(context.applicationContext).also { instance = it }
        }
    }
}
