package com.shahab.waterreminder.wear

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.wear.remote.interactions.RemoteActivityHelper
import com.shahab.waterreminder.wear.data.*
import com.shahab.waterreminder.wear.surface.WatchSurfaceUpdates
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.TimeUnit

class WatchViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = WatchRepository.get(application)
    val state = repository.state
    private val _access = MutableStateFlow(false)
    val access = _access.asStateFlow()
    private val _message = MutableStateFlow<Int?>(null)
    val message = _message.asStateFlow()
    private val _now = MutableStateFlow(System.currentTimeMillis())
    val now = _now.asStateFlow()
    private var visibleJob: Job? = null
    init {
        viewModelScope.launch(Dispatchers.IO) { repository.reload() }
        viewModelScope.launch(Dispatchers.IO) { repository.state.collect { _access.value = repository.hasAccess(); _now.value = System.currentTimeMillis() } }
    }
    fun visible(visible: Boolean) {
        visibleJob?.cancel()
        if (!visible) return
        refresh()
        visibleJob = viewModelScope.launch(Dispatchers.IO) {
            while (isActive) {
                _now.value = System.currentTimeMillis()
                _access.value = repository.hasAccess()
                val expiry = state.value.snapshot?.accessUntil ?: 0
                delay(if (expiry > _now.value) (expiry - _now.value + 20).coerceIn(1000, 60_000) else 60_000)
            }
        }
    }
    fun refresh() { WatchSyncWorker.enqueue(getApplication(), true) }
    fun add(amount: Int) { viewModelScope.launch(Dispatchers.IO) {
        try {
            repository.add(amount)
            _message.value = R.string.saved
            WatchSurfaceUpdates.request(getApplication())
            WatchSyncWorker.enqueue(getApplication(), true)
        } catch (_: IllegalStateException) { _message.value = if (repository.state.value.pendingCount >= 200) R.string.pending_limit else R.string.plus_body }
        catch (_: Exception) { _message.value = R.string.save_failed }
    } }
    fun undo(id: String) { viewModelScope.launch(Dispatchers.IO) {
        try {
            repository.undo(id)
            _message.value = R.string.undone
            WatchSurfaceUpdates.request(getApplication())
            WatchSyncWorker.enqueue(getApplication(), true)
        } catch (_: Exception) { _message.value = R.string.save_failed }
    } }
    fun clearMessage() { _message.value = null }
    fun openPhone() { viewModelScope.launch(Dispatchers.IO) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("waterreminder://wear-settings"))
                .addCategory(Intent.CATEGORY_BROWSABLE).setPackage(getApplication<Application>().packageName)
            RemoteActivityHelper(getApplication()).startRemoteActivity(intent, state.value.phoneId).get(10, TimeUnit.SECONDS)
        } catch (_: Exception) { _message.value = R.string.phone_unavailable }
    } }
}
