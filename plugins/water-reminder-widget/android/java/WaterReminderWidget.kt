package __PACKAGE__.widgets

import android.content.Context
import android.content.ComponentName
import android.graphics.Color
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.Button
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.actionParametersOf
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.provideContent
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
import androidx.glance.unit.ColorProvider
import __PACKAGE__.MainActivity
import java.text.DateFormat
import java.util.Date
import kotlin.math.roundToInt

class WaterReminderWidget : GlanceAppWidget() {
  override val sizeMode: SizeMode = SizeMode.Responsive(
    setOf(
      DpSize(110.dp, 110.dp),
      DpSize(250.dp, 110.dp),
      DpSize(250.dp, 250.dp)
    )
  )

  override suspend fun provideGlance(context: Context, id: androidx.glance.GlanceId) {
    provideContent {
      val state = WidgetStateStore.read(context)
      WidgetContent(context = context, state = state)
    }
  }
}

@Composable
private fun WidgetContent(context: Context, state: WidgetState?) {
  val size = LocalSize.current
  val isExpanded = size.height >= 220.dp
  val isMedium = size.width >= 220.dp
  val colors = widgetColors(state)

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(colors.background)
      .padding(14.dp),
    verticalAlignment = Alignment.Vertical.CenterVertically
  ) {
    if (state == null || !state.onboardingCompleted || state.goalMl <= 0) {
      FallbackContent(context, colors)
      return@Column
    }

    Row(
      modifier = GlanceModifier.fillMaxWidth(),
      verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
      Box(
        modifier = GlanceModifier
          .size(22.dp)
          .background(colors.primary)
      ) {}
      Spacer(modifier = GlanceModifier.width(8.dp))
      Text(
        text = if (state.goalCompleted) "Goal complete" else "Water Reminder",
        style = TextStyle(
          color = colors.textPrimary,
          fontSize = 14.sp,
          fontWeight = FontWeight.Bold
        )
      )
    }

    Spacer(modifier = GlanceModifier.height(8.dp))

    Text(
      text = formatAmount(state.consumedMl, state.measurementUnit),
      style = TextStyle(
        color = colors.textPrimary,
        fontSize = if (isMedium) 28.sp else 22.sp,
        fontWeight = FontWeight.Bold
      )
    )
    Text(
      text = "${state.completionPercentage}% of ${formatAmount(state.goalMl, state.measurementUnit)}",
      style = TextStyle(color = colors.textSecondary, fontSize = 12.sp)
    )

    Spacer(modifier = GlanceModifier.height(8.dp))
    ProgressSegments(state.completionPercentage, colors)

    if (isMedium && !state.goalCompleted) {
      Spacer(modifier = GlanceModifier.height(6.dp))
      Text(
        text = "${formatAmount(state.remainingMl, state.measurementUnit)} left",
        style = TextStyle(color = colors.textSecondary, fontSize = 12.sp)
      )
    }

    if (isExpanded) {
      Spacer(modifier = GlanceModifier.height(6.dp))
      Text(
        text = "Streak ${state.currentStreak} day${if (state.currentStreak == 1) "" else "s"}",
        style = TextStyle(color = colors.textSecondary, fontSize = 12.sp)
      )
      state.nextReminderAt?.let {
        Text(
          text = "Next ${DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(it))}",
          style = TextStyle(color = colors.textSecondary, fontSize = 12.sp)
        )
      }
    }

    Spacer(modifier = GlanceModifier.height(8.dp))
    QuickActions(state = state, isMedium = isMedium, isExpanded = isExpanded)
  }
}

@Composable
private fun FallbackContent(context: Context, colors: WidgetColors) {
  Text(
    text = "Water Reminder",
    style = TextStyle(color = colors.textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
  )
  Spacer(modifier = GlanceModifier.height(8.dp))
  Button(
    text = "Open app",
    onClick = actionStartActivity(openHomeIntent(context))
  )
}

@Composable
private fun QuickActions(state: WidgetState, isMedium: Boolean, isExpanded: Boolean) {
  Row(modifier = GlanceModifier.fillMaxWidth()) {
    QuickAddButton(amountMl = 250, state = state)
    if (isMedium) {
      Spacer(modifier = GlanceModifier.width(6.dp))
      QuickAddButton(amountMl = 500, state = state)
    }
    if (isExpanded) {
      Spacer(modifier = GlanceModifier.width(6.dp))
      QuickAddButton(amountMl = 750, state = state)
    }
  }
}

@Composable
private fun QuickAddButton(amountMl: Int, state: WidgetState) {
  Button(
    text = "+${amountMl}",
    onClick = actionRunCallback<WidgetQuickAddAction>(
      actionParametersOf(
        WidgetActionKeys.amount to amountMl,
        WidgetActionKeys.actionNonce to state.actionNonce
      )
    )
  )
}

@Composable
private fun ProgressSegments(completionPercentage: Int, colors: WidgetColors) {
  Row(modifier = GlanceModifier.fillMaxWidth()) {
    val filledSegments = (completionPercentage.coerceIn(0, 100) / 10.0).roundToInt()

    repeat(10) { index ->
      Box(
        modifier = GlanceModifier
          .width(14.dp)
          .height(6.dp)
          .background(if (index < filledSegments) colors.primary else colors.track)
      ) {}
      Spacer(modifier = GlanceModifier.width(3.dp))
    }
  }
}

private fun openHomeIntent(context: Context): ComponentName {
  return ComponentName(context, MainActivity::class.java)
}

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
  val textPrimary: ColorProvider,
  val textSecondary: ColorProvider,
  val track: ColorProvider
)

private fun widgetColors(state: WidgetState?): WidgetColors {
  val dark = state?.themePreference == "dark"

  return if (dark) {
    WidgetColors(
      background = ColorProvider(Color.rgb(16, 30, 27)),
      primary = ColorProvider(Color.rgb(90, 211, 190)),
      textPrimary = ColorProvider(Color.WHITE),
      textSecondary = ColorProvider(Color.rgb(196, 216, 211)),
      track = ColorProvider(Color.rgb(48, 72, 67))
    )
  } else {
    WidgetColors(
      background = ColorProvider(Color.rgb(247, 251, 248)),
      primary = ColorProvider(Color.rgb(18, 139, 119)),
      textPrimary = ColorProvider(Color.rgb(18, 49, 43)),
      textSecondary = ColorProvider(Color.rgb(83, 107, 102)),
      track = ColorProvider(Color.rgb(213, 232, 228))
    )
  }
}
