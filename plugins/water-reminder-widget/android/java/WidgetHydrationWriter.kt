package __PACKAGE__.widgets

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import java.io.File
import java.time.Instant
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

object WidgetHydrationWriter {
  private const val databaseName = "water_reminder.db"

  fun addWater(context: Context, amountMl: Int, actionId: String): Boolean {
    if (amountMl <= 0 || !WidgetStateStore.markProcessed(context, actionId)) {
      return false
    }

    val databaseFile = File(File(context.filesDir, "SQLite"), databaseName)

    if (!databaseFile.exists()) {
      return false
    }

    val now = Instant.now().toString()
    val entryId = "widget_${System.currentTimeMillis()}_${UUID.randomUUID()}"
    val database = SQLiteDatabase.openDatabase(
      databaseFile.absolutePath,
      null,
      SQLiteDatabase.OPEN_READWRITE
    )

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
    } catch (_: Throwable) {
      return false
    } finally {
      runCatching { database.endTransaction() }
      database.close()
    }

    updateSnapshotAfterAdd(context, amountMl)
    return true
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

  private fun updateSnapshotAfterAdd(context: Context, amountMl: Int) {
    val state = WidgetStateStore.read(context) ?: return
    val consumedMl = state.consumedMl + amountMl
    val remainingMl = max(state.goalMl - consumedMl, 0)
    val completion = if (state.goalMl <= 0) 0 else min((consumedMl * 100) / state.goalMl, 999)

    WidgetStateStore.write(
      context,
      state.copy(
        actionNonce = UUID.randomUUID().toString(),
        completionPercentage = completion,
        consumedMl = consumedMl,
        goalCompleted = consumedMl >= state.goalMl,
        remainingMl = remainingMl,
        updatedAt = System.currentTimeMillis()
      )
    )
  }
}
