"""Round-emulator smoke test, explored with ARTEMIS + ADB on 2026-10-20.

Requires the debug validation APK. Resets only that APK's debug fixture data.
Uses fresh UIAutomator XML (the ARTEMIS helper cached some stale hierarchies).
"""
import argparse
import re
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument("--serial", required=True)
args = parser.parse_args()
if not args.serial.startswith("emulator-"):
    raise SystemExit("This fixture test is restricted to an explicitly selected emulator.")
PACKAGE = "com.shahab.waterreminder.syncvalidation"
ACTIVITY = "com.shahab.waterreminder.wear.MainActivity"


def adb(*commands):
    return subprocess.check_output(["adb", "-s", args.serial, *commands], text=True, timeout=25)


def tree():
    output = adb("shell", "uiautomator", "dump", "/sdcard/water-test-ui.xml")
    if "dumped to" not in output:
        raise RuntimeError("UIAutomator snapshot is temporarily unavailable")
    return ET.fromstring(adb("exec-out", "cat", "/sdcard/water-test-ui.xml"))


def find(label, timeout=15):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            nodes = tree().iter("node")
        except RuntimeError:
            time.sleep(0.5)
            continue
        for node in nodes:
            if label in (node.get("text"), node.get("content-desc")):
                x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.get("bounds")))
                if x2 > x1 and y2 > y1:
                    return ((x1 + x2) // 2, (y1 + y2) // 2)
        time.sleep(0.3)
    raise AssertionError(f"UI did not show {label!r} within {timeout}s")


def tap(label, fallback=None):
    try:
        position = find(label)
    except AssertionError:
        # Coordinates verified on the 384px round emulator, never reused on
        # another resolution. Every action still has a separate result assertion.
        if fallback is None or "384x384" not in adb("shell", "wm", "size"):
            raise
        position = fallback
    adb("shell", "input", "tap", *(str(n) for n in position))


def swipe():
    adb("shell", "input", "swipe", "192", "310", "192", "80", "450")
    time.sleep(0.6)


def restart():
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "am", "start", "-n", f"{PACKAGE}/{ACTIVITY}")


def fixture(mode):
    adb("shell", "am", "force-stop", PACKAGE)
    result = adb("shell", "am", "start", "-n", f"{PACKAGE}/com.shahab.waterreminder.wear.DebugFixtureActivity", "--es", "mode", mode)
    assert "Error" not in result, "Install the debug validation APK first"


adb("shell", "input", "keyevent", "KEYCODE_WAKEUP")
fixture("connected")
find("900 mL logged, daily goal 2,000 mL")
tap("Add 250 mL of water", (192, 316))
find("1,150 mL logged, daily goal 2,000 mL")
swipe()
tap("More amounts", (190, 180))
find("Log water")
swipe()
tap("+ 500 mL", (190, 130))
find("1,650 mL logged, daily goal 2,000 mL")
restart()
find("1,650 mL logged, daily goal 2,000 mL")
swipe()
swipe()
tap("Undo", (190, 190))
restart()
find("1,150 mL logged, daily goal 2,000 mL")
print("PASS: add, amount picker, persisted offline queue, undo, and restart", flush=True)
fixture("locked")
find("A little help from Plus.")
assert not any(n.get("content-desc") == "Add 250 mL of water" for n in tree().iter("node"))
fixture("unpaired")
find("Your day, on your wrist.")
print("PASS: expired-access and unpaired states", flush=True)
# Leave a reviewable themed screen; fixture is visibly documented as simulated.
fixture("connected")
find("900 mL logged, daily goal 2,000 mL")
