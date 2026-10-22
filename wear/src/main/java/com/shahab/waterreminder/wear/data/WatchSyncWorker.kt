package com.shahab.waterreminder.wear.data

import android.content.Context
import android.net.Uri
import androidx.work.*
import com.google.android.gms.wearable.*
import com.shahab.waterreminder.wear.protocol.*
import com.shahab.waterreminder.wear.surface.WatchSurfaceUpdates
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WatchSyncWorker(context: Context, parameters: WorkerParameters) : CoroutineWorker(context, parameters) {
    override suspend fun doWork(): Result {
        try {
            val repository = WatchRepository.get(applicationContext)
            repository.reload()
            val client = Wearable.getDataClient(applicationContext)
            val phones = Wearable.getCapabilityClient(applicationContext)
                .getCapability(WearProtocol.PHONE_CAPABILITY, CapabilityClient.FILTER_ALL).await().nodes
            val savedPhone = repository.state.value.phoneId
            val phone = phones.firstOrNull { it.id == savedPhone } ?: if (savedPhone == null) phones.sortedByDescending { it.isNearby }.firstOrNull() else null
            val buffer = client.dataItems.await()
            try {
                if (phone != null) for (item in buffer) {
                    if (item.uri.host != phone.id || item.uri.path != WearProtocol.SNAPSHOT) continue
                    val bytes = item.data ?: continue
                    if (bytes.size > WearProtocol.MAX_PAYLOAD) continue
                    val snapshot = runCatching { WearSnapshot.parse(JSONObject(String(bytes, Charsets.UTF_8))) }.getOrNull() ?: continue
                    repository.accept(snapshot, phone.id)
                }
            } finally { buffer.release() }
            val localNode = Wearable.getNodeClient(applicationContext).localNode.await()
            for (drink in repository.state.value.drinks) {
                if (drink.pending) {
                    // Persisted on both sides; a disconnected watch does not lose a tap.
                    client.putDataItem(PutDataRequest.create(WearProtocol.ENTRY + drink.entry.id)
                        .setData(drink.entry.json().toString().toByteArray(Charsets.UTF_8)).setUrgent()).await()
                } else if (!drink.cleaned) {
                    client.deleteDataItems(Uri.Builder().scheme("wear").authority(localNode.id).path(WearProtocol.ENTRY + drink.entry.id).build()).await()
                    repository.markCleaned(drink.entry.id, drink.entry.revision)
                }
            }
            repository.prune()
            if (inputData.getBoolean("request", false) && phone != null) {
                runCatching { Wearable.getMessageClient(applicationContext).sendMessage(phone.id, WearProtocol.REQUEST, byteArrayOf()).await() }
            }
            WatchSurfaceUpdates.request(applicationContext)
            return Result.success()
        } catch (cancelled: kotlinx.coroutines.CancellationException) { throw cancelled }
        catch (error: Exception) {
            android.util.Log.w("WaterWear", "Sync deferred: ${error.javaClass.simpleName}; attempt=$runAttemptCount")
            return if (runAttemptCount < 5) Result.retry() else Result.failure()
        }
    }
    companion object {
        fun enqueue(context: Context, request: Boolean = false) {
            WorkManager.getInstance(context).enqueueUniqueWork("water-wear-watch", ExistingWorkPolicy.APPEND_OR_REPLACE,
                OneTimeWorkRequestBuilder<WatchSyncWorker>().setInputData(workDataOf("request" to request))
                    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS).build())
        }
    }
}
