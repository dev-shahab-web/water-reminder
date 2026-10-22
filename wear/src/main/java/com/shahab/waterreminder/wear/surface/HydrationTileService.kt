package com.shahab.waterreminder.wear.surface

import androidx.wear.tiles.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.ModifiersBuilders.*
import androidx.wear.protolayout.ActionBuilders.*
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.concurrent.futures.CallbackToFutureAdapter
import com.google.common.util.concurrent.ListenableFuture
import com.shahab.waterreminder.wear.R
import com.shahab.waterreminder.wear.MainActivity
import com.shahab.waterreminder.wear.formatWater
import com.shahab.waterreminder.wear.data.WatchRepository
import kotlinx.coroutines.*
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

class HydrationTileService : TileService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    override fun onDestroy() { scope.cancel(); super.onDestroy() }
    override fun onTileRequest(params: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> =
        CallbackToFutureAdapter.getFuture { result ->
            val job = scope.launch { try { result.set(buildTile()) } catch (error: Exception) { result.setException(error) } }
            result.addCancellationListener({ job.cancel() }, { it.run() })
            "hydration tile"
        }
    private fun buildTile(): TileBuilders.Tile {
        val repository = WatchRepository.get(this)
        repository.reload()
        val state = repository.state.value
        val snapshot = state.snapshot
        val access = repository.hasAccess()
        val primary = android.graphics.Color.parseColor(snapshot?.palette?.primary ?: "#8DDDD3")
        fun text(value: String, size: Float, tint: Int = 0xffeaf3ef.toInt()) = Text.Builder().setText(value)
            .setFontStyle(FontStyle.Builder().setSize(sp(size)).setColor(argb(tint)).build()).build()
        val launch = LaunchAction.Builder().setAndroidActivity(AndroidActivity.Builder().setPackageName(packageName).setClassName(MainActivity::class.java.name).build()).build()
        val button = Box.Builder().setWidth(dp(148f)).setHeight(dp(48f))
            .setModifiers(Modifiers.Builder().setClickable(Clickable.Builder().setId("open_water").setOnClick(launch).build())
                .setBackground(Background.Builder().setColor(argb(primary)).setCorner(Corner.Builder().setRadius(dp(24f)).build()).build())
                .setSemantics(Semantics.Builder().setContentDescription(getString(R.string.choose_amount)).build()).build())
            .addContent(text(getString(if (access) R.string.choose_amount else R.string.open_watch), 14f, 0xff101816.toInt())).build()
        val content = Column.Builder().setWidth(expand()).setHeight(expand()).setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
            .setModifiers(Modifiers.Builder().setPadding(Padding.Builder().setAll(dp(24f)).build()).build())
            .addContent(text(getString(R.string.today), 12f, primary))
            .addContent(Spacer.Builder().setHeight(dp(8f)).build())
            .addContent(text(if (snapshot != null && access) formatWater(state.total(System.currentTimeMillis()), snapshot.unit) else getString(R.string.app_name), 24f))
            .addContent(text(if (snapshot != null && access) getString(R.string.goal_progress, "${(state.total(System.currentTimeMillis())*100.0/snapshot.goalMl.coerceAtLeast(1)).roundToInt()}%", formatWater(snapshot.goalMl, snapshot.unit)) else getString(R.string.connect_short), 12f))
            .addContent(Spacer.Builder().setHeight(dp(12f)).build()).addContent(button).build()
        val now = System.currentTimeMillis()
        val zone = ZoneId.of(snapshot?.zone ?: ZoneId.systemDefault().id)
        val midnight = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val boundary = minOf(midnight, snapshot?.accessUntil?.takeIf { it > now } ?: midnight)
        val expired = Box.Builder().setWidth(expand()).setHeight(expand()).addContent(button).build()
        val timeline = TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(TimelineBuilders.TimelineEntry.Builder()
                .setValidity(TimelineBuilders.TimeInterval.Builder().setStartMillis(now).setEndMillis(boundary).build())
                .setLayout(Layout.Builder().setRoot(content).build()).build())
            .addTimelineEntry(TimelineBuilders.TimelineEntry.Builder()
                .setValidity(TimelineBuilders.TimeInterval.Builder().setStartMillis(boundary).setEndMillis(Long.MAX_VALUE).build())
                .setLayout(Layout.Builder().setRoot(expired).build()).build()).build()
        return TileBuilders.Tile.Builder().setResourcesVersion("1").setTileTimeline(timeline).build()
    }
    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
        CallbackToFutureAdapter.getFuture { result -> result.set(ResourceBuilders.Resources.Builder().setVersion("1").build()); "hydration resources" }
}
