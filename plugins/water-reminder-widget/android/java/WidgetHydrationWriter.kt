package __PACKAGE__.widgets

import android.content.Context
import android.util.Log
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatterBuilder
import java.util.UUID
import kotlin.math.roundToInt

object WidgetHydrationWriter {
  private const val tag = "WaterReminderWidget"
  // Match Date.toISOString() exactly so TEXT range queries include midnight.
  private val iso = DateTimeFormatterBuilder().appendInstant(3).toFormatter()

  private fun openDatabase(context: Context): WidgetDatabase? {
    val file = File(File(context.filesDir, "SQLite"), "water_reminder.db")
    if (!file.exists()) return null
    return WidgetDatabase.open(file.absolutePath)
  }

  @Synchronized
  fun addWater(context: Context, amountMl: Int, actionId: String): Boolean {
    if (amountMl !in 1..5000) return false
    return try {
      val database = openDatabase(context) ?: return false
      database.use {
        val now = iso.format(Instant.now())
        val entryId = "widget_${UUID.randomUUID()}"
        var inserted = false
        database.beginTransaction()
        try {
          database.execSQL("""
            CREATE TABLE IF NOT EXISTS widget_actions (
              actionId TEXT PRIMARY KEY NOT NULL,
              amount INTEGER NOT NULL CHECK (amount > 0),
              createdAt TEXT NOT NULL
            );
          """.trimIndent())
          // Deduplication and the entry commit together. Failed writes remain
          // retryable; a repeated action cannot insert a second entry.
          val actionInserted = database.insertIfAbsent(
            "INSERT OR IGNORE INTO widget_actions (actionId, amount, createdAt) VALUES (?, ?, ?)",
            arrayOf(actionId, amountMl, now)
          )
          if (actionInserted) {
            database.execSQL("""
              INSERT INTO hydration_entries (id, timestamp, amount, source, createdAt, updatedAt)
              VALUES (?, ?, ?, 'widget', ?, ?);
            """.trimIndent(), arrayOf<Any>(entryId, now, amountMl, now, now))
            inserted = true
          }
          database.setTransactionSuccessful()
        } finally {
          database.endTransaction()
        }
        Log.d(tag, "Widget hydration transaction committed inserted=$inserted")
        inserted
      }
    } catch (error: Exception) {
      Log.e(tag, "Widget hydration write failed", error)
      false
    }
  }

  // Reconcile on every refresh, including periodic launcher updates, process
  // restarts, day changes and concurrent React Native writes.
  @Synchronized
  fun refreshSnapshot(context: Context): WidgetState? = synchronized(WidgetStateStore) {
    val state = WidgetStateStore.read(context) ?: return null
    return try {
      val database = openDatabase(context) ?: return state
      database.use {
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val start = iso.format(today.atStartOfDay(zone).toInstant())
        val end = iso.format(today.plusDays(1).atStartOfDay(zone).toInstant())
        val consumedMl = database.rawQuery("""
          SELECT COALESCE(SUM(amount), 0) FROM hydration_entries
          WHERE timestamp >= ? AND timestamp < ?;
        """.trimIndent(), arrayOf(start, end)).use { cursor ->
          if (cursor.moveToFirst()) cursor.getInt(0) else 0
        }
        val completed = state.goalMl > 0 && consumedMl >= state.goalMl
        val completedDays = mutableSetOf<LocalDate>()
        if (completed) {
          database.rawQuery("""
            SELECT date(timestamp, 'localtime'), SUM(amount) FROM hydration_entries
            GROUP BY date(timestamp, 'localtime') HAVING SUM(amount) >= ?;
          """.trimIndent(), arrayOf(state.goalMl.toString())).use { cursor ->
            while (cursor.moveToNext()) completedDays.add(LocalDate.parse(cursor.getString(0)))
          }
        }
        var streak = 0
        var day = today
        while (completedDays.contains(day)) {
          streak++
          day = day.minusDays(1)
        }
        val refreshed = state.copy(
          actionNonce = UUID.randomUUID().toString(),
          completionPercentage = if (state.goalMl <= 0) 0 else
            (consumedMl.toDouble() * 100 / state.goalMl).roundToInt().coerceIn(0, 999),
          consumedMl = consumedMl,
          currentStreak = streak,
          goalCompleted = completed,
          remainingMl = (state.goalMl - consumedMl).coerceAtLeast(0),
          nextReminderAt = state.nextReminderAt?.takeIf { !completed && it > System.currentTimeMillis() },
          updatedAt = System.currentTimeMillis()
        )
        WidgetStateStore.write(context, refreshed)
        refreshed
      }
    } catch (error: Exception) {
      Log.e(tag, "Widget snapshot reconciliation failed", error)
      state
    }
  }
}
