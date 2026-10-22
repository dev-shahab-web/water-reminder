package __PACKAGE__.wear

import com.google.android.gms.wearable.*
import com.shahab.waterreminder.wear.protocol.WearProtocol

class PhoneWearListenerService : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        if (events.any { it.dataItem.uri.path?.startsWith(WearProtocol.ENTRY) == true })
            PhoneWearSyncWorker.enqueue(this, true)
    }
    override fun onMessageReceived(event: MessageEvent) {
        if (event.path == WearProtocol.REQUEST) PhoneWearSyncWorker.enqueue(this, true)
    }
    override fun onPeerConnected(peer: Node) { PhoneWearSyncWorker.enqueue(this, true) }
    override fun onCapabilityChanged(capability: CapabilityInfo) {
        if (capability.name == WearProtocol.WATCH_CAPABILITY) PhoneWearSyncWorker.enqueue(this, true)
    }
}
