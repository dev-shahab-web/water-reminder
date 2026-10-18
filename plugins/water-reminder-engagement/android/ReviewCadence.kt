package __PACKAGE__.engagement

import java.util.concurrent.TimeUnit

internal object ReviewCadence {
  fun isDue(firstInstallTime: Long, lastPromptAt: Long, now: Long, firstDays: Long, repeatDays: Long): Boolean {
    val firstDue = firstInstallTime + TimeUnit.DAYS.toMillis(firstDays.coerceIn(1, 365))
    val nextDue = if (lastPromptAt > 0) lastPromptAt + TimeUnit.DAYS.toMillis(repeatDays.coerceIn(1, 365)) else firstDue
    return firstInstallTime > 0 && now >= firstDue && now >= nextDue
  }
}
