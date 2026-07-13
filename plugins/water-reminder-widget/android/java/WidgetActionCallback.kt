package __PACKAGE__.widgets

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import java.util.UUID

object WidgetActionKeys {
  val amount = ActionParameters.Key<Int>("amountMl")
  val actionNonce = ActionParameters.Key<String>("actionNonce")
}

object WidgetActionEvents {
  const val actionHydrationChanged = "__PACKAGE__.widgets.HYDRATION_CHANGED"
  const val extraAmountMl = "amountMl"
}

class WidgetQuickAddAction : ActionCallback {
  private val tag = "WaterReminderWidget"

  override suspend fun onAction(
    context: Context,
    glanceId: GlanceId,
    parameters: ActionParameters
  ) {
    val amountMl = parameters[WidgetActionKeys.amount] ?: return
    val nonce = parameters[WidgetActionKeys.actionNonce] ?: UUID.randomUUID().toString()
    val actionId = "quick_add_${amountMl}_${nonce}_${System.currentTimeMillis()}_${UUID.randomUUID()}"

    val didAdd = WidgetHydrationWriter.addWater(context, amountMl, actionId)
    Log.d(tag, "Glance state sync requested didAdd=$didAdd")
    if (didAdd) {
      context.sendBroadcast(
        Intent(WidgetActionEvents.actionHydrationChanged)
          .setPackage(context.packageName)
          .putExtra(WidgetActionEvents.extraAmountMl, amountMl)
      )
    }
    WaterReminderWidget.syncStateAndUpdate(context, "widget_quick_add")
  }
}
