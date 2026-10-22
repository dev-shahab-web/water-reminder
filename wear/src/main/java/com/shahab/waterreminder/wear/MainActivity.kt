package com.shahab.waterreminder.wear

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.BasicSwipeToDismissBox
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.*
import com.shahab.waterreminder.wear.protocol.*
import java.text.NumberFormat
import kotlin.math.*

class MainActivity : ComponentActivity() {
    private val model: WatchViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { WaterWatch(model) }
    }
    override fun onStart() { super.onStart(); model.visible(true) }
    override fun onStop() { model.visible(false); super.onStop() }
}

fun formatWater(amount: Int, unit: String): String {
    val number = NumberFormat.getNumberInstance().apply { maximumFractionDigits = if (unit == "oz") 1 else 0 }
    return "${number.format(if (unit == "oz") amount / 29.5735 else amount.toDouble())} ${if (unit == "oz") "oz" else "mL"}"
}
private fun color(hex: String) = Color(android.graphics.Color.parseColor(hex))

@Composable private fun WaterWatch(model: WatchViewModel) {
    val state by model.state.collectAsStateWithLifecycle()
    val access by model.access.collectAsStateWithLifecycle()
    val now by model.now.collectAsStateWithLifecycle()
    val message by model.message.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val snapshot = state.snapshot
    val palette = if (access) snapshot?.palette ?: WearPalette() else WearPalette()
    var more by rememberSaveable { mutableStateOf(false) }
    val list = rememberTransformingLazyColumnState()
    LaunchedEffect(more) { list.scrollToItem(0) }
    val typography = remember(snapshot?.themeId, access) {
        val theme = if (access) snapshot?.themeId else "default"
        val family = when (theme) {
            "jade" -> "WR-Rounded-Regular.ttf"
            "expressive", "violet", "rose" -> "WR-Sans-Regular.ttf"
            else -> null
        }
        val body = family?.let { FontFamily(android.graphics.Typeface.createFromAsset(context.assets, it)) } ?: FontFamily.Default
        val base = Typography(defaultFontFamily = body)
        if (theme == "rose") {
            val display = FontFamily(android.graphics.Typeface.createFromAsset(context.assets, "WR-Serif-Bold.ttf"))
            base.copy(titleMedium = base.titleMedium.copy(fontFamily = display), titleSmall = base.titleSmall.copy(fontFamily = display))
        } else base
    }
    BackHandler(more) { more = false }
    LaunchedEffect(message) {
        message?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            if (it == R.string.saved || it == R.string.undone) haptics.performHapticFeedback(HapticFeedbackType.Confirm)
            model.clearMessage()
        }
    }
    MaterialTheme(typography = typography, colorScheme = ColorScheme(
        primary = color(palette.primary), onPrimary = color(palette.onPrimary),
        primaryContainer = color(palette.surface), onPrimaryContainer = color(palette.onSurface),
        surfaceContainer = color(palette.surface), onSurface = color(palette.onSurface),
        onSurfaceVariant = color(palette.muted), background = Color.Black, onBackground = color(palette.onSurface),
    )) {
        BasicSwipeToDismissBox(onDismissed = { if (more) more = false else (context as? android.app.Activity)?.finish() }) { background ->
        if (!background) AppScaffold {
            ScreenScaffold(scrollState = list, contentPadding = PaddingValues(horizontal = 20.dp, vertical = 30.dp)) { padding ->
                TransformingLazyColumn(state = list, modifier = Modifier.fillMaxSize(), contentPadding = padding,
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (snapshot == null || !snapshot.setup || !access) {
                        item {
                            Column(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Image(painterResource(R.drawable.ic_water), contentDescription = null, modifier = Modifier.size(24.dp))
                                Text(stringResource(if (snapshot == null) R.string.connect_title else R.string.plus_title),
                                    textAlign = TextAlign.Center, style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.height(8.dp))
                                Text(stringResource(if (snapshot == null) R.string.connect_body else if (!snapshot.setup) R.string.setup_body else R.string.plus_body),
                                    textAlign = TextAlign.Center, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        item { Button(onClick = model::openPhone, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.open_phone)) } }
                        item { FilledTonalButton(onClick = model::refresh, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.retry)) } }
                        for (drink in state.drinks.filter { !it.entry.deleted && it.error != "invalid" }.take(3)) item(key = drink.entry.id) {
                            FilledTonalButton(onClick = { model.undo(drink.entry.id) }, modifier = Modifier.fillMaxWidth(),
                                secondaryLabel = { Text(stringResource(R.string.undo)) }, label = { Text(formatWater(drink.entry.amountMl, snapshot?.unit ?: "ml")) })
                        }
                    } else {
                        if (!more) {
                            item { WaterHero(state.total(now), snapshot, Modifier.fillMaxWidth()) }
                            item { Button(onClick = { model.add(snapshot.presets.first()) }, modifier = Modifier.fillMaxWidth()
                                .semantics { contentDescription = context.getString(R.string.add_water_label, formatWater(snapshot.presets.first(), snapshot.unit)) }) {
                                Text(stringResource(R.string.add_amount, formatWater(snapshot.presets.first(), snapshot.unit)))
                            } }
                            item { FilledTonalButton(onClick = { more = true }, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.more_amounts)) } }
                        } else {
                            item { Text(stringResource(R.string.choose_amount), style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 10.dp)) }
                            for (amount in snapshot.presets) item(key = "amount_$amount") {
                                Button(onClick = { model.add(amount); more = false }, modifier = Modifier.fillMaxWidth()) {
                                    Text(stringResource(R.string.add_amount, formatWater(amount, snapshot.unit)))
                                }
                            }
                            item { FilledTonalButton(onClick = { more = false }, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.back)) } }
                        }
                        item {
                            Text(if (state.pendingCount > 0) stringResource(R.string.sync_pending, state.pendingCount)
                            else stringResource(if (now - state.receivedAt < 120_000) R.string.sync_current else R.string.sync_cached),
                                style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center,
                                color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(vertical = 6.dp))
                        }
                        if (state.drinks.any { it.error != null }) item { Text(stringResource(R.string.sync_error), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodySmall) }
                        item { Text(stringResource(R.string.recent), style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)) }
                        val recent = state.drinks.filter { !it.entry.deleted && it.error != "invalid" }.take(3)
                        if (recent.isEmpty()) item { Text(stringResource(R.string.no_recent), style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center) }
                        for (drink in recent) item(key = drink.entry.id) {
                            FilledTonalButton(onClick = { model.undo(drink.entry.id) }, modifier = Modifier.fillMaxWidth(),
                                secondaryLabel = { Text(stringResource(R.string.undo)) }, label = { Text(formatWater(drink.entry.amountMl, snapshot.unit)) })
                        }
                        item { TextButton(onClick = model::refresh, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.retry)) } }
                    }
                }
            }
        }
        }
    }
}

@Composable private fun WaterHero(total: Int, snapshot: WearSnapshot, modifier: Modifier = Modifier) {
    val target = if (snapshot.goalMl > 0) (total.toFloat() / snapshot.goalMl).coerceIn(0f, 1f) else 0f
    val progress by animateFloatAsState(target, tween(if (snapshot.reduceMotion) 0 else 650), label = "water_fill")
    val height = (LocalConfiguration.current.screenHeightDp * 0.49f).coerceIn(96f, 132f).dp
    val description = stringResource(R.string.progress_accessibility, formatWater(total, snapshot.unit), formatWater(snapshot.goalMl, snapshot.unit))
    Box(modifier.height(height).semantics(mergeDescendants = true) { contentDescription = description; progressBarRangeInfo = ProgressBarRangeInfo(target, 0f..1f) }, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxHeight().aspectRatio(1f)) {
            val r = size.minDimension / 2 - 4.dp.toPx()
            val c = center
            drawCircle(color(snapshot.palette.surface), r, c)
            val circle = Path().apply { addOval(Rect(c.x - r, c.y - r, c.x + r, c.y + r)) }
            // Circular-segment area matches the phone's water volume. No idle loop
            // or sensor subscription runs on the watch.
            var low = -1f; var high = 1f
            repeat(12) { val y = (low + high) / 2; val area = (acos(y) - y * sqrt(1 - y * y)) / PI.toFloat(); if (area > progress) low = y else high = y }
            val level = c.y + (low + high) / 2 * r
            clipPath(circle) {
                drawRect(Brush.verticalGradient(listOf(color(snapshot.palette.waterTop), color(snapshot.palette.waterBottom))), Offset(c.x - r, level), Size(r * 2, (c.y + r - level).coerceAtLeast(0f)))
                if (progress > 0f && progress < 1f) drawLine(color(snapshot.palette.primary).copy(alpha = 0.65f), Offset(c.x - r, level), Offset(c.x + r, level), 1.dp.toPx())
            }
            drawCircle(color(snapshot.palette.primary).copy(alpha = 0.2f), r + 2.dp.toPx(), c, style = Stroke(1.dp.toPx()))
            drawArc(color(snapshot.palette.primary), -90f, progress * 360f, false, Offset(c.x-r-2.dp.toPx(), c.y-r-2.dp.toPx()), Size(2*r+4.dp.toPx(), 2*r+4.dp.toPx()), style = Stroke(2.dp.toPx(), cap = StrokeCap.Round))
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clearAndSetSemantics {}) {
            Text(stringResource(R.string.today), style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, letterSpacing = 1.sp)
            Text(formatWater(total, snapshot.unit), fontSize = (if (total >= 10000) 17 else if (total >= 1000) 20 else 24).sp, fontWeight = FontWeight.Bold, maxLines = 1)
            Text(if (total >= snapshot.goalMl) stringResource(R.string.goal_done) else stringResource(R.string.remaining, formatWater(snapshot.goalMl - total, snapshot.unit)), fontSize = 10.sp, maxLines = 1)
        }
    }
}
