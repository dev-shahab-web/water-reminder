package com.shahab.waterreminder.wear.surface

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import androidx.work.*
import com.shahab.waterreminder.wear.data.WatchRepository
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.TimeUnit

object WatchSurfaceUpdates {
    fun request(context: Context) {
        TileService.getUpdater(context).requestUpdate(HydrationTileService::class.java)
        ComplicationDataSourceUpdateRequester.create(context, ComponentName(context, HydrationComplicationService::class.java)).requestUpdateAll()
        val now = System.currentTimeMillis()
        val repository = WatchRepository.get(context)
        repository.reload()
        val snapshot = repository.state.value.snapshot
        val zone = snapshot?.zone?.let { ZoneId.of(it) } ?: ZoneId.systemDefault()
        val midnight = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val boundary = minOf(midnight, snapshot?.accessUntil?.takeIf { it > now } ?: midnight)
        WorkManager.getInstance(context).enqueueUniqueWork("water-watch-boundary", ExistingWorkPolicy.REPLACE,
            OneTimeWorkRequestBuilder<WatchBoundaryWorker>().setInitialDelay((boundary-now+1000).coerceAtLeast(1000), TimeUnit.MILLISECONDS).build())
    }
}
class WatchBoundaryWorker(context: Context, parameters: WorkerParameters) : Worker(context, parameters) {
    override fun doWork(): Result { WatchSurfaceUpdates.request(applicationContext); return Result.success() }
}
