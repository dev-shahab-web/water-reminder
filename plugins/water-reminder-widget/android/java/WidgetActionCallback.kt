package __PACKAGE__.widgets

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import java.util.UUID

object WidgetActionKeys {
  val amount = ActionParameters.Key<Int>("amountMl")
  val actionNonce = ActionParameters.Key<String>("actionNonce")
}

class WidgetQuickAddAction : ActionCallback {
  override suspend fun onAction(
    context: Context,
    glanceId: GlanceId,
    parameters: ActionParameters
  ) {
    val amountMl = parameters[WidgetActionKeys.amount] ?: return
    val nonce = parameters[WidgetActionKeys.actionNonce] ?: UUID.randomUUID().toString()
    val actionId = "quick_add_${amountMl}_${nonce}"

    WidgetHydrationWriter.addWater(context, amountMl, actionId)
    WaterReminderWidget().update(context, glanceId)
  }
}
