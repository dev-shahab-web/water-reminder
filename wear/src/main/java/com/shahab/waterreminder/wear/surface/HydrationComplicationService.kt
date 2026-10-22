package com.shahab.waterreminder.wear.surface

import android.app.PendingIntent
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.*
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import com.shahab.waterreminder.wear.MainActivity
import com.shahab.waterreminder.wear.R
import com.shahab.waterreminder.wear.data.WatchRepository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.roundToInt

class HydrationComplicationService : SuspendingComplicationDataSourceService() {
    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData = withContext(Dispatchers.IO) {
        val repository = WatchRepository.get(this@HydrationComplicationService)
        repository.reload()
        val state = repository.state.value
        val snapshot = state.snapshot
        val now = System.currentTimeMillis()
        val access = repository.hasAccess(now)
        val progress = if (access && snapshot != null && snapshot.goalMl > 0) (state.total(now).toFloat()/snapshot.goalMl).coerceIn(0f,1f) else 0f
        val percent = (progress*100).roundToInt()
        val text = if (!access) getString(if (snapshot == null) R.string.connect_short else R.string.plus_short) else "$percent%"
        val action = PendingIntent.getActivity(this@HydrationComplicationService, 0, Intent(this@HydrationComplicationService, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val description = PlainComplicationText.Builder(if (access) getString(R.string.complication_progress_description, percent) else getString(if (snapshot == null) R.string.connect_body else R.string.plus_body)).build()
        val image = MonochromaticImage.Builder(Icon.createWithResource(this@HydrationComplicationService, R.drawable.ic_water_mono)).build()
        val zone = ZoneId.of(snapshot?.zone ?: ZoneId.systemDefault().id)
        val boundary = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val validUntil = minOf(boundary, snapshot?.accessUntil?.takeIf { it > now } ?: boundary)
        val range = TimeRange.between(Instant.ofEpochMilli(now), Instant.ofEpochMilli(validUntil))
        if (request.complicationType == ComplicationType.RANGED_VALUE)
            RangedValueComplicationData.Builder(progress*100, 0f, 100f, description)
                .setText(PlainComplicationText.Builder(text).build()).setMonochromaticImage(image).setTapAction(action).setValidTimeRange(range).build()
        else ShortTextComplicationData.Builder(PlainComplicationText.Builder(text).build(), description)
            .setMonochromaticImage(image).setTapAction(action).setValidTimeRange(range).build()
    }
    override fun getPreviewData(type: ComplicationType): ComplicationData {
        val description = PlainComplicationText.Builder(getString(R.string.complication_progress_description, 50)).build()
        val text = PlainComplicationText.Builder("50%").build()
        val image = MonochromaticImage.Builder(Icon.createWithResource(this, R.drawable.ic_water_mono)).build()
        return if (type == ComplicationType.RANGED_VALUE) RangedValueComplicationData.Builder(50f, 0f, 100f, description).setText(text).setMonochromaticImage(image).build()
        else ShortTextComplicationData.Builder(text, description).setMonochromaticImage(image).build()
    }
}
