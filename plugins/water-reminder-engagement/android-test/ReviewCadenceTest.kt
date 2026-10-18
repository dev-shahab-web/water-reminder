package __PACKAGE__.engagement

import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.TimeUnit

class ReviewCadenceTest {
  private val install = 1_700_000_000_000L
  private fun day(days: Long) = install + TimeUnit.DAYS.toMillis(days)

  @Test fun firstReminderWaitsFiveFullDays() {
    assertFalse(ReviewCadence.isDue(install, 0, day(5) - 1, 5, 7))
    assertTrue(ReviewCadence.isDue(install, 0, day(5), 5, 7))
  }
  @Test fun repeatsOneWeekAfterLastReminder() {
    assertFalse(ReviewCadence.isDue(install, day(5), day(12) - 1, 5, 7))
    assertTrue(ReviewCadence.isDue(install, day(5), day(12), 5, 7))
  }
  @Test fun aDelayedDeliveryDoesNotCauseAnEarlySecondReminder() {
    assertFalse(ReviewCadence.isDue(install, day(6), day(12), 5, 7))
    assertTrue(ReviewCadence.isDue(install, day(6), day(13), 5, 7))
  }
  @Test fun invalidInstallAndClockRollbackDoNotPrompt() {
    assertFalse(ReviewCadence.isDue(0, 0, day(20), 5, 7))
    assertFalse(ReviewCadence.isDue(install, day(5), day(4), 5, 7))
  }
  @Test fun reopeningTheStoreSnoozesWithoutPermanentlyCompletingReview() {
    assertFalse(ReviewCadence.isDue(install, day(9), day(12), 5, 7))
    assertTrue(ReviewCadence.isDue(install, day(9), day(16), 5, 7))
  }
}
