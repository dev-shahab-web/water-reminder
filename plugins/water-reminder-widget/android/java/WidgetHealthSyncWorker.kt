package __PACKAGE__.widgets

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.units.Volume
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.io.File
import java.time.Instant
import java.time.format.DateTimeFormatterBuilder
import kotlinx.coroutines.CancellationException

/** Exports committed widget entries even when the JS process is not running. */
class WidgetHealthSyncWorker(context: Context, parameters: WorkerParameters) : CoroutineWorker(context, parameters) {
  override suspend fun doWork(): Result {
    if (HealthConnectClient.getSdkStatus(applicationContext) != HealthConnectClient.SDK_AVAILABLE) return Result.success()
    return try {
      val client = HealthConnectClient.getOrCreate(applicationContext)
      val permission = HealthPermission.getWritePermission(HydrationRecord::class)
      if (!client.permissionController.getGrantedPermissions().contains(permission)) return Result.success()
      val file = File(File(applicationContext.filesDir, "SQLite"), "water_reminder.db")
      if (!file.exists()) return Result.success()
      WidgetDatabase.open(file.absolutePath).use { database ->
        val entries = mutableListOf<PendingHydration>()
        database.rawQuery("""
          SELECT id, timestamp, amount, updatedAt FROM hydration_entries
          WHERE source = 'widget' AND healthConnectRecordId IS NULL ORDER BY timestamp;
        """.trimIndent(), null).use { cursor ->
          while (cursor.moveToNext()) entries.add(PendingHydration(cursor.getString(0), cursor.getString(1), cursor.getInt(2), cursor.getString(3)))
        }
        for (entry in entries) {
          val start = Instant.parse(entry.timestamp)
          val response = client.insertRecords(listOf(HydrationRecord(
            startTime = start,
            startZoneOffset = null,
            endTime = start.plusMillis(1),
            endZoneOffset = null,
            volume = Volume.milliliters(entry.amount.toDouble()),
            // Shared with JS: retries or simultaneous foreground sync upsert
            // this record instead of counting the same drink twice.
            metadata = Metadata(clientRecordId = entry.id,
              clientRecordVersion = Instant.parse(entry.updatedAt).toEpochMilli(),
              recordingMethod = Metadata.RECORDING_METHOD_MANUAL_ENTRY)
          )))
          val recordId = response.recordIdsList.single()
          val syncedAt = DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(Instant.now())
          database.execSQL("""
            UPDATE hydration_entries SET healthConnectRecordId = ?,
              healthConnectClientRecordId = ?, healthConnectSyncedAt = ?
            WHERE id = ? AND amount = ? AND updatedAt = ?;
          """.trimIndent(), arrayOf<Any>(recordId, entry.id, syncedAt, entry.id, entry.amount, entry.updatedAt))
          val stillExists = database.rawQuery(
            "SELECT 1 FROM hydration_entries WHERE id = ?", arrayOf(entry.id)
          ).use { it.moveToFirst() }
          if (!stillExists) {
            // A foreground removal can commit while insertRecords is suspended.
            client.deleteRecords(HydrationRecord::class, listOf(recordId), listOf(entry.id))
          }
        }
      }
      Result.success()
    } catch (cancelled: CancellationException) {
      throw cancelled
    } catch (_: SecurityException) {
      // Permissions can be revoked while work is running. Keep rows pending.
      Result.success()
    } catch (error: Exception) {
      Log.w("WaterReminderWidget", "Widget Health Connect sync will retry", error)
      if (runAttemptCount < 3) Result.retry() else Result.failure()
    }
  }

  private data class PendingHydration(val id: String, val timestamp: String, val amount: Int, val updatedAt: String)

  companion object {
    fun enqueue(context: Context) {
      // Append ensures a drink committed during an active export isn't missed.
      WorkManager.getInstance(context).enqueueUniqueWork(
        "widget_health_connect_sync", ExistingWorkPolicy.APPEND_OR_REPLACE,
        OneTimeWorkRequestBuilder<WidgetHealthSyncWorker>().build()
      )
    }
  }
}
