"""Paired release smoke test explored with ARTEMIS on Pixel 7 / Watch4.

Requires adb, Python, uiautomator2, an unlocked paired watch, and verified Plus.
Uses the real package and UI; never writes entitlement or debug-fixture data.
All added test drinks are undone after successful verification. Do not log water
manually during the run. --offline temporarily isolates the phone's radios and
restores their original state even when an assertion fails.
"""

import argparse
import json
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import uiautomator2 as u2

PACKAGE = "com.shahab.waterreminder"
PHONE_ACTIVITY = f"{PACKAGE}.MainActivity"
WATCH_ACTIVITY = f"{PACKAGE}.wear.MainActivity"


class Device:
    def __init__(self, serial, activity):
        self.serial, self.activity = serial, activity
        self.observer = u2.connect(serial)

    def adb(self, *args):
        return subprocess.check_output(
            ["adb", "-s", self.serial, *args], text=True, timeout=25
        ).strip()

    def nodes(self):
        # Fresh XML avoids stale UiObject2 handles during Compose recomposition.
        return list(ET.fromstring(self.observer.dump_hierarchy()).iter("node"))

    def find(self, label):
        for node in self.nodes():
            if label in (node.get("text"), node.get("content-desc"), node.get("resource-id")):
                bounds = list(map(int, re.findall(r"\d+", node.get("bounds", ""))))
                if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                    return node, bounds
        return None

    def wait(self, predicate, description, timeout=35):
        deadline = time.monotonic() + timeout
        last_error = None
        while time.monotonic() < deadline:
            try:
                result = predicate()
                if result:
                    return result
            except Exception as error:
                last_error = error
            time.sleep(0.4)
        raise AssertionError(f"{self.serial}: timed out waiting for {description}; {last_error}")

    def tap(self, label, fallback=None):
        try:
            _, bounds = self.wait(lambda: self.find(label), label, 10)
            x, y = (bounds[0] + bounds[2]) // 2, (bounds[1] + bounds[3]) // 2
        except AssertionError:
            # Only use verified 450x450 Watch4 coordinates on that resolution,
            # and only while the live tree identifies this app's screen.
            if (fallback is None or "450x450" not in self.adb("shell", "wm", "size")
                    or not any(n.get("package") == PACKAGE for n in self.nodes())):
                raise
            x, y = fallback
        self.adb("shell", "input", "tap", str(x), str(y))

    def swipe(self, up=True):
        width, height = self.observer.window_size()
        start, end = (0.78, 0.23) if up else (0.23, 0.84)
        self.adb("shell", "input", "swipe", str(width // 2), str(int(height * start)),
                 str(width // 2), str(int(height * end)), "400")
        time.sleep(0.6)

    def start(self, restart=False):
        if restart:
            self.adb("shell", "am", "force-stop", PACKAGE)
        self.adb("shell", "input", "keyevent", "KEYCODE_WAKEUP")
        self.adb("shell", "am", "start", "-n", f"{PACKAGE}/{self.activity}")

    def total(self):
        for node in self.nodes():
            label = node.get("content-desc", "")
            pattern = (r"([\d,]+) mL logged, daily goal" if self.activity == WATCH_ACTIVITY
                       else r"Today's hydration\. ([\d,]+) ml logged\.")
            match = re.search(pattern, label)
            if match:
                return int(match.group(1).replace(",", ""))
        return None

    def expect_total(self, amount):
        self.wait(lambda: self.total() == amount, f"total {amount} mL")

    def scroll_find(self, label):
        for _ in range(6):
            result = self.find(label)
            if result:
                return result
            self.swipe()
        raise AssertionError(f"{self.serial}: missing {label} after scrolling")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--phone", required=True)
    parser.add_argument("--watch", required=True)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    assert args.phone != args.watch, "Select distinct phone and watch serials"
    phone, watch = Device(args.phone, PHONE_ACTIVITY), Device(args.watch, WATCH_ACTIVITY)
    checks = []

    def passed(name):
        checks.append(name)
        print(f"PASS: {name}", flush=True)

    def home_watch():
        watch.start(restart=True)
        watch.wait(lambda: watch.total() is not None, "unlocked metric watch dashboard")

    def acknowledged():
        watch.scroll_find("Recent watch drinks")
        watch.wait(lambda: watch.find("Synced with phone"), "phone acknowledgment", 45)

    def undo_latest(amount):
        watch.scroll_find("Undo")
        # Topmost Undo belongs to the latest drink created by this run.
        watch.tap("Undo")
        home_watch()
        watch.expect_total(amount)

    radio_settings = {}
    for name in ("wifi_on", "mobile_data", "bluetooth_on"):
        radio_settings[name] = phone.adb("shell", "settings", "get", "global", name)
    stay_on = watch.adb("shell", "settings", "get", "global", "stay_on_while_plugged_in")
    screen_timeout = watch.adb("shell", "settings", "get", "system", "screen_off_timeout")

    def restore_radios():
        for setting, service in (("wifi_on", "wifi"), ("mobile_data", "data")):
            phone.adb("shell", "svc", service, "enable" if radio_settings[setting] == "1" else "disable")
        phone.adb("shell", "cmd", "bluetooth_manager",
                  "enable" if radio_settings["bluetooth_on"] == "1" else "disable")

    try:
        watch.adb("shell", "svc", "power", "stayon", "true")
        watch.adb("shell", "settings", "put", "system", "screen_off_timeout", "600000")
        phone.start()
        baseline = phone.wait(lambda: (phone.total(),) if phone.total() is not None else None,
                              "metric phone dashboard")[0]
        home_watch()
        watch.expect_total(baseline)
        acknowledged()
        home_watch()
        watch.wait(lambda: watch.find("Add 250 mL of water"), "verified Plus and 250 mL preset")
        passed("real Plus, same starting total, no pending watch commands")

        phone.adb("shell", "input", "keyevent", "KEYCODE_HOME")
        watch.tap("Add 250 mL of water", (225, 354))
        watch.expect_total(baseline + 250)
        acknowledged()
        phone.start()
        phone.expect_total(baseline + 250)
        passed("watch add synchronizes while phone UI is closed")

        phone.adb("shell", "input", "keyevent", "KEYCODE_HOME")
        undo_latest(baseline)
        acknowledged()
        phone.start()
        phone.expect_total(baseline)
        passed("watch undo synchronizes and foreground phone refreshes")

        if args.offline:
            phone.adb("shell", "input", "keyevent", "KEYCODE_HOME")
            phone.adb("shell", "svc", "wifi", "disable")
            phone.adb("shell", "svc", "data", "disable")
            phone.adb("shell", "cmd", "bluetooth_manager", "disable")
            time.sleep(6)  # Exact transport-disconnect settling time, no LLM latency.
            home_watch()
            watch.tap("Add 250 mL of water", (225, 354))
            watch.expect_total(baseline + 250)
            watch.scroll_find("More amounts")
            watch.tap("More amounts")
            watch.wait(lambda: watch.find("Log water"), "amount picker")
            watch.scroll_find("+ 500 mL")
            watch.tap("+ 500 mL", (225, 340))
            watch.expect_total(baseline + 750)
            home_watch()
            watch.expect_total(baseline + 750)
            watch.scroll_find("2 saved on watch")
            passed("two offline drinks and amount picker survive process restart")
            undo_latest(baseline + 250)
            passed("offline undo survives process restart before add acknowledgment")
            restore_radios()
            acknowledged()
            phone.start(restart=True)
            phone.expect_total(baseline + 250)
            home_watch()
            watch.expect_total(baseline + 250)
            passed("reconnection reconciles desired states without double counting")
            undo_latest(baseline)
            acknowledged()
            phone.start()
            phone.expect_total(baseline)
            passed("all smoke-test drinks undone; original total restored")
        home_watch()
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps({"package": PACKAGE, "phone": args.phone,
                "watch": args.watch, "baselineMl": baseline, "passed": checks}, indent=2),
                encoding="utf-8")
    finally:
        if args.offline:
            restore_radios()
        watch.adb("shell", "settings", "put", "global", "stay_on_while_plugged_in", stay_on)
        watch.adb("shell", "settings", "put", "system", "screen_off_timeout", screen_timeout)


if __name__ == "__main__":
    main()
