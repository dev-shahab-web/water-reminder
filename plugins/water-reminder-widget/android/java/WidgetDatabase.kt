@file:Suppress("INVISIBLE_MEMBER", "INVISIBLE_REFERENCE")

package __PACKAGE__.widgets

import android.database.MatrixCursor
import android.util.Log
import expo.modules.sqlite.NativeDatabaseBinding
import expo.modules.sqlite.NativeStatementBinding
import java.io.Closeable

/**
 * Use Expo's SQLite engine, not android.database.sqlite.SQLiteDatabase.
 * Two SQLite libraries opening the same WAL in one process do not share their
 * lock bookkeeping. Closing the Android connection can discard Expo's writes.
 * This adapter intentionally tracks the bindings in the pinned expo-sqlite
 * version; verify it when upgrading Expo (including a minified device build).
 */
internal class WidgetDatabase private constructor(
  private val binding: NativeDatabaseBinding
) : Closeable {
  private var transactionSuccessful = false

  private fun checkResult(result: Int, expected: Int = NativeDatabaseBinding.SQLITE_OK) {
    check(result == expected) { binding.convertSqlLiteErrorToString() }
  }

  fun execSQL(sql: String, args: Array<out Any?>? = null) {
    if (args == null) {
      checkResult(binding.sqlite3_exec(sql))
    } else {
      withStatement(sql, args) { checkResult(it.sqlite3_step(), NativeDatabaseBinding.SQLITE_DONE) }
    }
  }

  private fun <T> withStatement(sql: String, args: Array<out Any?>, block: (NativeStatementBinding) -> T): T {
    val statement = NativeStatementBinding()
    var prepared = false
    try {
      checkResult(binding.sqlite3_prepare_v2(sql, statement))
      prepared = true
      args.forEachIndexed { index, value -> checkResult(statement.bindStatementParam(index + 1, value)) }
      return block(statement)
    } finally {
      if (prepared) statement.sqlite3_finalize()
      statement.close()
    }
  }

  fun rawQuery(sql: String, args: Array<out Any?>?): MatrixCursor =
    withStatement(sql, args ?: emptyArray()) { statement ->
      val cursor = MatrixCursor(statement.getColumnNames().toTypedArray())
      try {
        var result = statement.sqlite3_step()
        while (result == NativeDatabaseBinding.SQLITE_ROW) {
          cursor.addRow(statement.getColumnValues().toTypedArray())
          result = statement.sqlite3_step()
        }
        checkResult(result, NativeDatabaseBinding.SQLITE_DONE)
        cursor
      } catch (error: Throwable) {
        cursor.close()
        throw error
      }
    }

  fun insertIfAbsent(sql: String, args: Array<out Any?>): Boolean {
    execSQL(sql, args)
    return binding.sqlite3_changes() > 0
  }

  fun beginTransaction() {
    execSQL("BEGIN IMMEDIATE")
    transactionSuccessful = false
  }

  fun setTransactionSuccessful() {
    transactionSuccessful = true
  }

  fun endTransaction() {
    execSQL(if (transactionSuccessful) "COMMIT" else "ROLLBACK")
  }

  override fun close() {
    try {
      checkResult(binding.sqlite3_close())
    } finally {
      binding.close()
    }
  }

  companion object {
    init {
      Log.i("WaterReminderWidget", "WIDGET_STORAGE_ENGINE=expo_shared_v1")
    }

    fun open(path: String): WidgetDatabase {
      val database = WidgetDatabase(NativeDatabaseBinding())
      try {
        database.checkResult(database.binding.sqlite3_open(path))
        database.execSQL("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
        return database
      } catch (error: Throwable) {
        database.close()
        throw error
      }
    }
  }
}
