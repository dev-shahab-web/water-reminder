package __PACKAGE__.widgets

import android.content.Context
import android.content.res.Configuration
import android.content.ComponentName
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.mutablePreferencesOf
import androidx.datastore.preferences.core.Preferences
import androidx.glance.action.clickable
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.currentState
import androidx.glance.action.actionParametersOf
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.unit.ColorProvider
import __PACKAGE__.MainActivity
import __PACKAGE__.R
import java.text.DateFormat
import java.util.Date
import kotlin.math.roundToInt

private const val GLANCE_MAX_CONTAINER_CHILDREN = 10
private const val WIDGET_LOG_TAG = "WaterReminderWidget"

class WaterReminderWidget : GlanceAppWidget(errorUiLayout = R.layout.water_reminder_widget_error) {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

  override val sizeMode: SizeMode = SizeMode.Responsive(
    setOf(
      DpSize(110.dp, 110.dp),
      DpSize(180.dp, 110.dp),
      DpSize(250.dp, 110.dp),
      DpSize(150.dp, 170.dp),
      DpSize(250.dp, 170.dp),
      DpSize(250.dp, 250.dp)
    )
  )

  override suspend fun provideGlance(context: Context, id: androidx.glance.GlanceId) {
    provideContent {
      val preferences = currentState<Preferences>()
      val stateJson = preferences[WidgetStateStore.glanceStateKey]
      val state = WidgetStateStore.parse(stateJson)
      WidgetContent(context = context, state = state)
    }
  }

  companion object {
    suspend fun syncStateAndUpdate(context: Context, source: String) {
      val stateJson = WidgetStateStore.readJson(context)
      val state = WidgetStateStore.parse(stateJson)
      val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(WaterReminderWidget::class.java)

      glanceIds.forEach { glanceId ->
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) {
          if (stateJson == null) {
            emptyPreferences()
          } else {
            mutablePreferencesOf(WidgetStateStore.glanceStateKey to stateJson)
          }
        }
      }

      Log.d(
        WIDGET_LOG_TAG,
        "Glance state updated source=$source widgetCount=${glanceIds.size} consumedMl=${state?.consumedMl} updatedAt=${state?.updatedAt}"
      )
      WaterReminderWidget().updateAll(context)
      Log.d(WIDGET_LOG_TAG, "Glance updateAll completed or queued source=$source")
    }
  }
}

@Composable
private fun WidgetContent(context: Context, state: WidgetState?) {
  val colors = widgetColors(context, state)
  val size = LocalSize.current
  val short = size.height < 160.dp
  val wide = size.width >= 220.dp
  val expanded = size.height >= 220.dp
  // Use a compact tile for short slots instead of clipping a full-height card.
  Column(
    modifier = GlanceModifier.fillMaxSize().appWidgetBackground()
      .background(colors.background).cornerRadius(24.dp)
      .clickable(actionStartActivity(openHomeIntent(context)))
      .padding(if (expanded) 16.dp else 12.dp),
    verticalAlignment = Alignment.Vertical.CenterVertically
  ) {
    if (state == null || !state.onboardingCompleted || state.goalMl <= 0) {
      FallbackContent(colors, short)
      return@Column
    }
    if (short) {
      CompactContent(state, colors, wide)
    } else {
      HeaderSection(state, colors)
      Spacer(GlanceModifier.height(10.dp))
      SummarySection(state, colors, large = true)
      Spacer(GlanceModifier.height(8.dp))
      ProgressBar(state, colors)
      if (expanded) {
        Spacer(GlanceModifier.height(10.dp))
        ContextSection(state, colors)
      }
      Spacer(GlanceModifier.defaultWeight())
      QuickActionsSection(state, colors, wide, expanded)
    }
  }
}

@Composable
private fun CompactContent(state: WidgetState, colors: WidgetColors, wide: Boolean) {
  Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
    Column(modifier = GlanceModifier.defaultWeight()) {
      SummarySection(state, colors, large = false)
      Spacer(GlanceModifier.height(6.dp))
      ProgressBar(state, colors)
    }
    if (wide) {
      Spacer(GlanceModifier.width(12.dp))
      QuickAddButton(250, state, colors, GlanceModifier.width(88.dp))
    }
  }
}

@Composable
private fun HeaderSection(state: WidgetState, colors: WidgetColors) {
  Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
    Image(
      provider = ImageProvider(R.drawable.water_reminder_widget_mark),
      contentDescription = null,
      modifier = GlanceModifier.size(20.dp)
    )
    Spacer(GlanceModifier.width(6.dp))
    Text(
      text = if (state.goalCompleted) "Goal reached" else "Today's water",
      maxLines = 1,
      style = TextStyle(color = colors.textSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    )
  }
}

@Composable
private fun SummarySection(state: WidgetState, colors: WidgetColors, large: Boolean) {
  Column(modifier = GlanceModifier.fillMaxWidth()) {
    Text(
      text = formatAmount(state.consumedMl, state.measurementUnit),
      maxLines = 1,
      style = TextStyle(color = colors.textPrimary, fontSize = if (large) 28.sp else 22.sp, fontWeight = FontWeight.Bold)
    )
    Text(
      text = "${state.completionPercentage}% of ${formatAmount(state.goalMl, state.measurementUnit)}",
      maxLines = 1,
      style = TextStyle(color = colors.textSecondary, fontSize = 11.sp)
    )
  }
}

@Composable
private fun ProgressBar(state: WidgetState, colors: WidgetColors) {
  LinearProgressIndicator(
    progress = state.completionPercentage.coerceIn(0, 100) / 100f,
    modifier = GlanceModifier.fillMaxWidth().height(6.dp).cornerRadius(3.dp),
    color = colors.primary,
    backgroundColor = colors.track
  )
}

@Composable
private fun ContextSection(state: WidgetState, colors: WidgetColors) {
  Column {
    Text(
      text = if (state.goalCompleted) "Daily goal complete" else "${formatAmount(state.remainingMl, state.measurementUnit)} to go",
      maxLines = 1,
      style = TextStyle(color = colors.primary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    )
    Spacer(GlanceModifier.height(4.dp))
    val next = state.nextReminderAt?.let { DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(it)) }
    Text(
      text = "${state.currentStreak} day${if (state.currentStreak == 1) "" else "s"} in a row" +
        (next?.let { "  ·  Next $it" } ?: ""),
      maxLines = 2,
      style = TextStyle(color = colors.textSecondary, fontSize = 11.sp)
    )
  }
}

@Composable
private fun FallbackContent(colors: WidgetColors, short: Boolean) {
  Column {
    Text(
      text = "Water Reminder",
      maxLines = 2,
      style = TextStyle(color = colors.textPrimary, fontSize = if (short) 14.sp else 18.sp, fontWeight = FontWeight.Bold)
    )
    Spacer(GlanceModifier.height(6.dp))
    Text(
      text = "Tap to get started",
      maxLines = 2,
      style = TextStyle(color = colors.primary, fontSize = 12.sp)
    )
  }
}

@Composable
private fun QuickActionsSection(state: WidgetState, colors: WidgetColors, wide: Boolean, expanded: Boolean) {
  val amounts = if (expanded) listOf(250, 500, 750) else if (wide) listOf(250, 500) else listOf(250)
  requireGlanceContainerChildren("QuickActionsSection", amounts.size * 2 - 1)
  Row(modifier = GlanceModifier.fillMaxWidth()) {
    amounts.forEachIndexed { index, amount ->
      if (index > 0) Spacer(GlanceModifier.width(6.dp))
      QuickAddButton(amount, state, colors, GlanceModifier.defaultWeight(), primary = index == 0)
    }
  }
}

@Composable
private fun QuickAddButton(amountMl: Int, state: WidgetState, colors: WidgetColors, modifier: GlanceModifier, primary: Boolean = true) {
  Box(
    modifier = modifier.height(48.dp)
      .background(if (primary) colors.primary else colors.track).cornerRadius(16.dp)
      .clickable(actionRunCallback<WidgetQuickAddAction>(
        actionParametersOf(
          WidgetActionKeys.amount to amountMl,
          WidgetActionKeys.actionNonce to state.actionNonce
        )
      )),
    contentAlignment = Alignment.Center
  ) {
    Text(
      text = "+${formatAmount(amountMl, state.measurementUnit)}",
      maxLines = 1,
      style = TextStyle(color = if (primary) colors.onPrimary else colors.textPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    )
  }
}

private fun requireGlanceContainerChildren(name: String, childCount: Int) {
  require(childCount <= GLANCE_MAX_CONTAINER_CHILDREN) {
    "$name has $childCount direct children; Glance containers support at most $GLANCE_MAX_CONTAINER_CHILDREN."
  }
}

private fun openHomeIntent(context: Context): ComponentName = ComponentName(context, MainActivity::class.java)

private fun formatAmount(amountMl: Int, unit: String): String {
  if (unit == "oz") {
    val ounces = amountMl / 29.5735
    return if (ounces >= 10) "${ounces.roundToInt()} oz" else String.format("%.1f oz", ounces)
  }
  if (amountMl >= 1000) {
    val litres = amountMl / 1000.0
    return if (litres % 1.0 == 0.0) "${litres.roundToInt()} L" else String.format("%.1f L", litres)
  }
  return "$amountMl ml"
}

private data class WidgetColors(
  val background: ColorProvider,
  val primary: ColorProvider,
  val onPrimary: ColorProvider,
  val textPrimary: ColorProvider,
  val textSecondary: ColorProvider,
  val track: ColorProvider
)

private fun widgetColors(context: Context, state: WidgetState?): WidgetColors {
  val dark = when (state?.themePreference) {
    "dark" -> true
    "light" -> false
    else -> context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
  }
  return if (dark) {
    WidgetColors(
      background = ColorProvider(Color(0xFF192732)),
      primary = ColorProvider(Color(0xFF8DDDD3)),
      onPrimary = ColorProvider(Color(0xFF101816)),
      textPrimary = ColorProvider(Color(0xFFEAF3EF)),
      textSecondary = ColorProvider(Color(0xFFB7C9D3)),
      track = ColorProvider(Color(0xFF304852))
    )
  } else {
    WidgetColors(
      background = ColorProvider(Color(0xFFF3F8FC)),
      primary = ColorProvider(Color(0xFF007A8A)),
      onPrimary = ColorProvider(Color.White),
      textPrimary = ColorProvider(Color(0xFF142B36)),
      textSecondary = ColorProvider(Color(0xFF526875)),
      track = ColorProvider(Color(0xFFDDEEF1))
    )
  }
}
