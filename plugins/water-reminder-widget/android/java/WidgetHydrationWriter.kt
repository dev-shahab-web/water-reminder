package __PACKAGE__.widgets

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

object WidgetHydrationWriter {
  private const val tag = "WaterReminderWidget"
  private const val databaseName = "water_reminder.db"

  fun addWater(context: Context, amountMl: Int, actionId: String): Boolean {
    Log.d(tag, "Widget action received amountMl=$amountMl")

    if (amountMl <= 0 || !WidgetStateStore.markProcessed(context, actionId)) {
      Log.d(tag, "Widget action skipped amountMl=$amountMl")
      return false
    }

    val databaseFile = File(File(context.filesDir, "SQLite"), databaseName)

    if (!databaseFile.exists()) {
      Log.d(tag, "Widget database unavailable for quick-add.")
      return false
    }

    val now = Instant.now().toString()
    val entryId = "widget_${System.currentTimeMillis()}_${UUID.randomUUID()}"
    val database = SQLiteDatabase.openDatabase(
      databaseFile.absolutePath,
      null,
      SQLiteDatabase.OPEN_READWRITE
    )

    var didWrite = false
    database.beginTransaction()
    try {
      ensureWidgetTables(database)
      database.execSQL(
        """
          INSERT OR IGNORE INTO widget_actions (actionId, amount, createdAt)
          VALUES (?, ?, ?);
        """.trimIndent(),
        arrayOf<Any>(actionId, amountMl, now)
      )
      database.execSQL(
        """
          INSERT INTO hydration_entries (
            id,
            timestamp,
            amount,
            source,
            createdAt,
            updatedAt,
            healthConnectRecordId,
            healthConnectClientRecordId,
            healthConnectDataOrigin,
            healthConnectSyncedAt
          )
          VALUES (?, ?, ?, 'widget', ?, ?, NULL, NULL, NULL, NULL);
        """.trimIndent(),
        arrayOf<Any>(entryId, now, amountMl, now, now)
      )
      database.setTransactionSuccessful()
      didWrite = true
    } catch (_: Throwable) {
      Log.d(tag, "Widget hydration write failed.")
    } finally {
      runCatching { database.endTransaction() }
    }

    if (didWrite) {
      Log.d(tag, "Widget hydration write committed.")
      updateSnapshotFromDatabase(context, database)
    }

    database.close()
    return didWrite
  }

  private fun ensureWidgetTables(database: SQLiteDatabase) {
    database.execSQL(
      """
        CREATE TABLE IF NOT EXISTS widget_actions (
          actionId TEXT PRIMARY KEY NOT NULL,
          amount INTEGER NOT NULL CHECK (amount > 0),
          createdAt TEXT NOT NULL
        );
      """.trimIndent()
    )
  }

  private fun updateSnapshotFromDatabase(context: Context, database: SQLiteDatabase) {
    val state = WidgetStateStore.read(context) ?: return
    val consumedMlBefore = state.consumedMl
    val consumedMl = getTodayConsumedMl(database)
    val remainingMl = max(state.goalMl - consumedMl, 0)
    val completion = if (state.goalMl <= 0) 0 else min((consumedMl * 100) / state.goalMl, 999)
    val didWriteSnapshot = WidgetStateStore.write(
      context,
      state.copy(
        actionNonce = UUID.randomUUID().toString(),
        completionPercentage = completion,
        consumedMl = consumedMl,
        goalCompleted = state.goalMl > 0 && consumedMl >= state.goalMl,
        remainingMl = remainingMl,
        updatedAt = System.currentTimeMillis()
      )
    )

    Log.d(
      tag,
      "Widget snapshot write completed=$didWriteSnapshot consumedMlBefore=$consumedMlBefore consumedMlAfter=$consumedMl"
    )
  }

  private fun getTodayConsumedMl(database: SQLiteDatabase): Int {
    val zone = ZoneId.systemDefault()
    val today = LocalDate.now(zone)
    val start = today.atStartOfDay(zone).toInstant().toString()
    val end = today.plusDays(1).atStartOfDay(zone).toInstant().toString()
    val cursor = database.rawQuery(
      """
        SELECT COALESCE(SUM(amount), 0) AS consumedMl
        FROM hydration_entries
        WHERE timestamp >= ? AND timestamp < ?;
      """.trimIndent(),
      arrayOf(start, end)
    )

    return cursor.use {
      if (it.moveToFirst()) {
        it.getInt(0)
      } else {
        0
      }
    }
  }
}
