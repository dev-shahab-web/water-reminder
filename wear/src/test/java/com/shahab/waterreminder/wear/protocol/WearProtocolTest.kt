package com.shahab.waterreminder.wear.protocol

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.time.Instant
import java.util.UUID

class WearProtocolTest {
    private val now = Instant.parse("2026-10-20T12:00:00Z").toEpochMilli()
    private fun snapshot() = WearSnapshot(UUID.randomUUID().toString(), 2, now, "2026-10-20", "Asia/Kolkata",
        750, 2500, "ml", listOf(250, 500), true, now - 1000, now + 3600000,
        "default", WearPalette(), false)
    private fun rejects(block: () -> Unit) { assertTrue(runCatching(block).isFailure) }

    @Test fun entryRoundTripsAndUndoKeepsIdentity() {
        val entry = WearEntry(UUID.randomUUID().toString(), 1, 250, now)
        assertEquals(entry, WearEntry.parse(JSONObject(entry.json().toString())))
        assertTrue(WearEntry.parse(entry.json().put("revision", 2)).deleted)
    }
    @Test fun malformedAndCoercedCommandsAreRejected() {
        val entry = WearEntry(UUID.randomUUID().toString(), 1, 250, now)
        for (amount in listOf<Any>(0, -1, 5001, 250.5, "250", 4294967546L))
            rejects { WearEntry.parse(entry.json().put("amountMl", amount)) }
        rejects { WearEntry.parse(entry.json().put("v", 2)) }
        rejects { WearEntry.parse(entry.json().put("id", "../entry")) }
        rejects { WearEntry.parse(entry.json().put("revision", 3)) }
    }
    @Test fun snapshotRoundTripsAllConfiguration() {
        val value = snapshot().copy(unit = "oz", reduceMotion = true,
            receipts = listOf(WearReceipt(UUID.randomUUID().toString(), 2, "accepted")))
        assertEquals(value, WearSnapshot.parse(JSONObject(value.json().toString())))
    }
    @Test fun accessIsBoundedAndRejectsRollback() {
        val value = snapshot()
        assertTrue(value.hasAccess(now))
        assertFalse(value.hasAccess(value.accessUntil))
        assertFalse(value.hasAccess(value.accessCheckedAt - 1))
        assertFalse(value.copy(accessUntil = value.accessCheckedAt + WearProtocol.OFFLINE_MS + 1).hasAccess(now))
    }
    @Test fun totalsResetAtPhoneMidnightIncludingDst() {
        val value = snapshot()
        assertEquals(750, value.totalToday(Instant.parse("2026-10-20T18:29:59Z").toEpochMilli()))
        assertEquals(0, value.totalToday(Instant.parse("2026-10-20T18:30:00Z").toEpochMilli()))
        assertEquals("2026-11-01", WearProtocol.dayKey(Instant.parse("2026-11-01T06:30:00Z").toEpochMilli(), "America/New_York"))
    }
    @Test fun invalidSnapshotsFailClosed() {
        rejects { WearSnapshot.parse(snapshot().json().put("goalMl", 0)) }
        rejects { WearSnapshot.parse(snapshot().json().put("zone", "Mars/Crater")) }
        rejects { WearSnapshot.parse(snapshot().json().put("day", "2026-10-19")) }
        rejects { WearSnapshot.parse(snapshot().json().put("revision", "9")) }
        rejects { WearSnapshot.parse(snapshot().json().put("unit", "litres")) }
    }
    @Test fun malformedPaletteFallsBackWithoutCrashingRenderer() {
        assertEquals(WearPalette().primary, WearPalette.parse(JSONObject().put("primary", "red")).primary)
    }
}
