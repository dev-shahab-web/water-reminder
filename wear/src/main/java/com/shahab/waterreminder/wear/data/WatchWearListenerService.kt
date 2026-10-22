package com.shahab.waterreminder.wear.data

import com.google.android.gms.wearable.*
import com.shahab.waterreminder.wear.protocol.WearProtocol

class WatchWearListenerService : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        if (events.any { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == WearProtocol.SNAPSHOT }) WatchSyncWorker.enqueue(this)
    }
    override fun onPeerConnected(peer: Node) { WatchSyncWorker.enqueue(this, true) }
    override fun onCapabilityChanged(capability: CapabilityInfo) {
        if (capability.name == WearProtocol.PHONE_CAPABILITY) WatchSyncWorker.enqueue(this, true)
    }
}
