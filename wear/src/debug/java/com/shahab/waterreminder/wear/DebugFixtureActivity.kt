package com.shahab.waterreminder.wear

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.shahab.waterreminder.wear.data.WatchRepository
import com.shahab.waterreminder.wear.protocol.*
import java.time.ZoneId
import java.util.UUID

/** Local visual QA fixture. This activity and its manifest exist only in debug APKs. */
class DebugFixtureActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val mode = intent.getStringExtra("mode") ?: "connected"
        Thread {
            val repo = WatchRepository.get(this)
            repo.writableDatabase.execSQL("DELETE FROM drinks")
            repo.writableDatabase.execSQL("DELETE FROM metadata")
            repo.reload()
            if (mode != "unpaired") {
                val now = System.currentTimeMillis()
                val zone = ZoneId.systemDefault().id
                repo.accept(WearSnapshot(UUID.randomUUID().toString(), 1, now, WearProtocol.dayKey(now, zone), zone,
                    900, 2000, if (mode == "oz") "oz" else "ml", listOf(250, 500, 750), true,
                    now - 1000, if (mode == "locked") 0 else now + 3_600_000,
                    "default", WearPalette(), false), "debug-fixture")
            }
            runOnUiThread { startActivity(Intent(this, MainActivity::class.java)); finish() }
        }.start()
    }
}
