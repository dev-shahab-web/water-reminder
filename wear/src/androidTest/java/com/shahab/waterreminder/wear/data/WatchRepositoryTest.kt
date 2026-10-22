package com.shahab.waterreminder.wear.data

import androidx.test.core.app.ApplicationProvider
import android.content.Context
import com.shahab.waterreminder.wear.protocol.*
import org.junit.*
import org.junit.Assert.*
import java.util.UUID

/** Real SQLite tests, isolated from the user's/visual fixture database. */
class WatchRepositoryTest {
    private val context = ApplicationProvider.getApplicationContext<Context>()
    private val name = "watch-test-${UUID.randomUUID()}.db"
    private lateinit var repo: WatchRepository
    private val now get() = System.currentTimeMillis()
    private lateinit var baseline: WearSnapshot
    @Before fun setup() {
        repo = WatchRepository(context, name)
        repo.reload()
        val time = now
        baseline = WearSnapshot(UUID.randomUUID().toString(), 1, time, WearProtocol.dayKey(time, "UTC"), "UTC",
            900, 2000, "ml", listOf(250, 500, 750), true, time - 1000, time + 3600000, "default", WearPalette(), false)
        repo.accept(baseline, "phone")
    }
    @After fun cleanup() { repo.close(); context.deleteDatabase(name) }
    @Test fun offlineAddSurvivesDatabaseReopen() {
        val drink = repo.add(250)
        repo.close()
        repo = WatchRepository(context, name)
        repo.reload()
        assertEquals(drink.id, repo.state.value.drinks.single().entry.id)
        assertEquals(1150, repo.state.value.total(now))
        assertTrue(repo.hasAccess())
    }
    @Test fun receiptAndTotalAreAppliedTogetherWithoutDoubleCounting() {
        val drink = repo.add(250)
        val ack = baseline.copy(revision = 2, consumedMl = 1150, receipts = listOf(WearReceipt(drink.id, 1, "accepted")))
        repo.accept(ack, "phone")
        repo.accept(ack, "phone")
        assertEquals(1150, repo.state.value.total(now))
        assertEquals(0, repo.state.value.pendingCount)
    }
    @Test fun undoBeforeAddReceiptRetainsPendingDeletion() {
        val drink = repo.add(250)
        repo.undo(drink.id)
        assertEquals(900, repo.state.value.total(now))
        repo.accept(baseline.copy(revision = 2, consumedMl = 1150, receipts = listOf(WearReceipt(drink.id, 1, "accepted"))), "phone")
        assertEquals(900, repo.state.value.total(now))
        assertEquals(1, repo.state.value.pendingCount)
        repo.accept(baseline.copy(revision = 3, receipts = listOf(WearReceipt(drink.id, 2, "accepted"))), "phone")
        assertEquals(900, repo.state.value.total(now))
        assertEquals(0, repo.state.value.pendingCount)
    }
    @Test fun cleanupCannotEraseAnUndoThatRacedWithAckDeletion() {
        val drink = repo.add(250)
        repo.accept(baseline.copy(revision = 2, consumedMl = 1150, receipts = listOf(WearReceipt(drink.id, 1, "accepted"))), "phone")
        repo.undo(drink.id)
        repo.markCleaned(drink.id, 1)
        repo.reload()
        assertFalse(repo.state.value.drinks.single().cleaned)
        assertTrue(repo.state.value.drinks.single().pending)
    }
    @Test fun staleAndForeignSnapshotsCannotRollBackState() {
        repo.accept(baseline.copy(revision = 3, consumedMl = 1500), "phone")
        repo.accept(baseline.copy(revision = 2, consumedMl = 0), "phone")
        repo.accept(baseline.copy(revision = 4, consumedMl = 0), "other-phone")
        assertEquals(1500, repo.state.value.total(now))
    }
    @Test fun clockRollbackOrRebootRequiresFreshEntitlement() {
        assertFalse(repo.hasAccess(baseline.accessCheckedAt - 1))
        repo.writableDatabase.execSQL("UPDATE metadata SET value='0' WHERE key='bootWall'")
        assertFalse(repo.hasAccess())
    }
    @Test fun expiredAccessBlocksAddsButAllowsOwnUndo() {
        val drink = repo.add(250)
        repo.accept(baseline.copy(revision = 2, accessUntil = 0), "phone")
        assertTrue(runCatching { repo.add(250) }.isFailure)
        repo.undo(drink.id)
        assertTrue(repo.state.value.drinks.single().entry.deleted)
    }
    @Test fun rejectedInvalidEntryStopsRetryingAndDoesNotInflateTotal() {
        val drink = repo.add(250)
        repo.accept(baseline.copy(revision = 2, receipts = listOf(WearReceipt(drink.id, 1, "invalid"))), "phone")
        assertEquals(0, repo.state.value.pendingCount)
        assertEquals(900, repo.state.value.total(now))
    }
    @Test fun oldConfirmedHistoryIsPrunedButPendingDataIsKept() {
        val drink = repo.add(250)
        repo.prune(now + 31 * WearProtocol.OFFLINE_MS)
        assertEquals(drink.id, repo.state.value.drinks.single().entry.id)
        repo.accept(baseline.copy(revision = 2, consumedMl = 1150, receipts = listOf(WearReceipt(drink.id, 1, "accepted"))), "phone")
        repo.markCleaned(drink.id, 1)
        repo.prune(now + 31 * WearProtocol.OFFLINE_MS)
        assertTrue(repo.state.value.drinks.isEmpty())
    }
}
