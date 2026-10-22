package __PACKAGE__.wear

import android.content.Context
import android.content.Intent
import androidx.work.*
import com.google.android.gms.wearable.*
import com.shahab.waterreminder.wear.protocol.*
import __PACKAGE__.premium.PremiumAccessStore
import __PACKAGE__.widgets.WidgetDatabase
import __PACKAGE__.widgets.WidgetStateStore
import __PACKAGE__.widgets.WidgetHealthSyncWorker
import __PACKAGE__.widgets.WaterReminderWidget
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatterBuilder
import java.util.concurrent.TimeUnit

/** Event-driven, serialized reconciliation. Never spins up React Native in the background. */
class PhoneWearSyncWorker(context: Context, parameters: WorkerParameters) : CoroutineWorker(context, parameters) {
    override suspend fun doWork(): Result = mutex.withLock {
        try {
            val context = applicationContext
            val client = Wearable.getDataClient(context)
            val watches = Wearable.getCapabilityClient(context)
                .getCapability(WearProtocol.WATCH_CAPABILITY, CapabilityClient.FILTER_ALL).await().nodes.map { it.id }.toSet()
            val commands = mutableListOf<Pair<String, WearEntry>>()
            val buffer = client.dataItems.await()
            try {
                for (item in buffer) {
                    val path = item.uri.path ?: continue
                    val host = item.uri.host ?: continue
                    if (host !in watches || !path.startsWith(WearProtocol.ENTRY)) continue
                    val bytes = item.data ?: continue
                    if (bytes.size > 2048) continue
                    val entry = runCatching { WearEntry.parse(JSONObject(String(bytes, Charsets.UTF_8))) }.getOrNull() ?: continue
                    if (path != WearProtocol.ENTRY + entry.id) continue
                    if (commands.size < 1000) commands.add(host to entry)
                }
            } finally { buffer.release() }

            val state = WidgetStateStore.read(context)
            val config = PhoneWearStore.configuration(context)
            val now = System.currentTimeMillis()
            val zone = ZoneId.systemDefault()
            val day = LocalDate.now(zone)
            var total = 0
            var changed = false
            val receipts = mutableListOf<WearReceipt>()
            val file = File(context.filesDir, "SQLite/water_reminder.db")
            if (file.exists() && state?.onboardingCompleted == true) {
                WidgetDatabase.open(file.absolutePath).use { db ->
                    db.beginTransaction()
                    try {
                        db.execSQL("""CREATE TABLE IF NOT EXISTS wear_receipts (
                            nodeId TEXT NOT NULL, entryId TEXT NOT NULL, revision INTEGER NOT NULL,
                            PRIMARY KEY(nodeId, entryId));""")
                        for ((host, entry) in commands) {
                            val previous = db.rawQuery("SELECT revision FROM wear_receipts WHERE nodeId = ? AND entryId = ?", arrayOf(host, entry.id)).use {
                                if (it.moveToFirst()) it.getInt(0) else 0
                            }
                            val status = when {
                                previous >= entry.revision -> "accepted"
                                // Undo may always remove the user's own watch record, even after expiry.
                                !entry.deleted && !PremiumAccessStore.isActive(context) -> "locked"
                                entry.timestamp > now + 300_000 || entry.timestamp < now - WearProtocol.MAX_AGE_MS -> "invalid"
                                else -> {
                                    val id = "wear_${host}_${entry.id}"
                                    if (entry.deleted) {
                                        db.execSQL("DELETE FROM hydration_entries WHERE id = ? AND source = 'wear_os'", arrayOf(id))
                                    } else {
                                        val timestamp = iso.format(Instant.ofEpochMilli(entry.timestamp))
                                        val committedAt = iso.format(Instant.ofEpochMilli(now))
                                        db.execSQL("""INSERT OR IGNORE INTO hydration_entries
                                            (id, timestamp, amount, source, createdAt, updatedAt)
                                            VALUES (?, ?, ?, 'wear_os', ?, ?)""", arrayOf(id, timestamp, entry.amountMl, committedAt, committedAt))
                                    }
                                    db.execSQL("INSERT OR REPLACE INTO wear_receipts(nodeId, entryId, revision) VALUES (?, ?, ?)", arrayOf(host, entry.id, entry.revision))
                                    changed = true
                                    "accepted"
                                }
                            }
                            receipts.add(WearReceipt(entry.id, maxOf(previous, entry.revision), status))
                        }
                        val start = iso.format(day.atStartOfDay(zone).toInstant())
                        val end = iso.format(day.plusDays(1).atStartOfDay(zone).toInstant())
                        total = db.rawQuery("SELECT COALESCE(SUM(amount), 0) FROM hydration_entries WHERE timestamp >= ? AND timestamp < ?", arrayOf(start, end)).use { it.moveToFirst(); it.getInt(0) }
                        db.setTransactionSuccessful()
                    } finally { db.endTransaction() }
                }
            } else {
                commands.forEach { receipts.add(WearReceipt(it.second.id, it.second.revision, "setup")) }
            }
            // Retry downstream refreshes even if a previous run committed and
            // died before it could publish its acknowledgment.
            if (receipts.any { it.status == "accepted" }) {
                WidgetHealthSyncWorker.enqueue(context)
                WaterReminderWidget.syncStateAndUpdate(context, "wear_os")
            }
            if (changed) context.sendBroadcast(Intent(ACTION_CHANGED).setPackage(context.packageName))
            val (generation, revision) = PhoneWearStore.identity(context)
            val snapshot = WearSnapshot(generation, revision, now, day.toString(), zone.id, total,
                state?.goalMl ?: 0, state?.measurementUnit ?: "ml", state?.quickAddAmountsMl ?: listOf(250, 500, 750),
                state?.onboardingCompleted == true, PremiumAccessStore.checkedAt(context),
                minOf(PremiumAccessStore.accessUntil(context), PremiumAccessStore.checkedAt(context) + WearProtocol.OFFLINE_MS),
                config.optString("themeId", "default"), WearPalette.parse(config.optJSONObject("palette")), config.optBoolean("reduceMotion"), receipts)
            val bytes = snapshot.json().toString().toByteArray(Charsets.UTF_8)
            check(bytes.size <= WearProtocol.MAX_PAYLOAD)
            // DataItem persistence supplies offline delivery. Only explicit actions are urgent.
            val request = PutDataRequest.create(WearProtocol.SNAPSHOT).setData(bytes)
            if (commands.isNotEmpty() || inputData.getBoolean("urgent", false)) request.setUrgent()
            client.putDataItem(request).await()
            Result.success()
        } catch (cancelled: kotlinx.coroutines.CancellationException) {
            throw cancelled
        } catch (error: Exception) {
            android.util.Log.w("WaterWear", "Sync deferred: ${error.javaClass.simpleName}; attempt=$runAttemptCount")
            // Commands remain in Data Layer and are safe to replay after process death.
            if (runAttemptCount < 5) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val ACTION_CHANGED = "__PACKAGE__.wear.HYDRATION_CHANGED"
        private val mutex = Mutex()
        private val iso = DateTimeFormatterBuilder().appendInstant(3).toFormatter()
        fun enqueue(context: Context, urgent: Boolean = false) {
            val work = OneTimeWorkRequestBuilder<PhoneWearSyncWorker>()
                .setInputData(workDataOf("urgent" to urgent))
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS).build()
            WorkManager.getInstance(context).enqueueUniqueWork("water-wear-phone", ExistingWorkPolicy.APPEND_OR_REPLACE, work)
        }
    }
}
