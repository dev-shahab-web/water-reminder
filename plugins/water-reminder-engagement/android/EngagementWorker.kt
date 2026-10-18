package __PACKAGE__.engagement

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.google.android.gms.tasks.Tasks
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import java.util.concurrent.TimeUnit

class EngagementWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    if (EngagementStore.config(applicationContext) == null) return Result.success()
    // Reviews remain local and can arrive offline. Play failures are retried on
    // the next scheduled check without claiming that the app is up to date.
    runCatching { EngagementStore.reviewIfDue(applicationContext) }
    runCatching {
      val info = Tasks.await(AppUpdateManagerFactory.create(applicationContext).appUpdateInfo, 25, TimeUnit.SECONDS)
      EngagementStore.updateNotification(applicationContext, info)
    }
    return Result.success()
  }
}
