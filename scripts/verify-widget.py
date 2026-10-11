#!/usr/bin/env python3
"""Device smoke test explored with ARTEMIS on Pixel 8, 2026-10-07.

Requires an onboarded app in ml and its widget on the launcher's current page.
Adds test drinks without deleting existing history. Uses only Python stdlib + ADB.
Example: python scripts/verify-widget.py --serial emulator-5556 --amount-ml 500 --cold
"""
import argparse
from decimal import Decimal, ROUND_HALF_UP
import json
import re
import subprocess
import time
import xml.etree.ElementTree as ET

PACKAGE = "com.shahab.waterreminder"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serial", required=True)
    parser.add_argument("--amount-ml", type=int, default=250)
    parser.add_argument("--taps", type=int, default=2)
    parser.add_argument("--cold", action="store_true", help="Kill the background app before tapping")
    args = parser.parse_args()
    if not 1 <= args.amount_ml <= 5000 or not 1 <= args.taps <= 5:
        parser.error("Use 1–5000 ml and 1–5 taps")

    def adb(*command):
        result = subprocess.run(["adb", "-s", args.serial, *command], check=True,
                                capture_output=True, text=True, encoding="utf-8", timeout=20)
        return result.stdout

    def hierarchy():
        adb("shell", "uiautomator", "dump", "/sdcard/water-widget-test.xml")
        return ET.fromstring(adb("shell", "cat", "/sdcard/water-widget-test.xml"))

    def wait_for(predicate, description, timeout=20):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            root = hierarchy()
            value = predicate(root)
            if value is not None:
                return value
            time.sleep(0.25)
        raise AssertionError(f"Timed out waiting for {description}")

    def find(root, label):
        return next((node for node in root.iter("node")
                     if label in (node.get("text"), node.get("content-desc"))), None)

    def app_total(root):
        for node in root.iter("node"):
            match = re.search(r"Today's hydration\. (\d+) ml logged", node.get("content-desc", ""))
            if match:
                return int(match.group(1))
        return None

    def open_app():
        adb("shell", "am", "start", "-a", "android.intent.action.VIEW",
            "-d", "waterreminder://", "-p", PACKAGE)

    def amount_label(amount):
        if amount < 1000:
            return f"{amount} ml"
        if amount % 1000 == 0:
            return f"{amount // 1000} L"
        return f"{(Decimal(amount) / 1000).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)} L"

    def tap_button(root, label):
        try:
            node = find(root, label)
            if node is None:
                raise ValueError(f"Select a {args.amount_ml} ml glass first")
            left, top, right, bottom = map(int, re.findall(r"\d+", node.get("bounds", "")))
            if right <= left or bottom <= top:
                raise ValueError("Empty button bounds")
            x, y = (left + right) // 2, (top + bottom) // 2
        except ValueError:
            # Verified fallback: first button in the 4x3 Pixel 8 widget at
            # 1080x2400, density 500. Never reuse it on a different layout.
            widget = find(root, "Water Reminder")
            actions = [n.get("text", "") for n in root.iter("node")
                       if n.get("text", "").startswith("+")]
            if (widget is None or not actions or actions[0] != label
                    or widget.get("bounds") != "[50,428][1030,1208]"
                    or "1080x2400" not in adb("shell", "wm", "size")):
                raise
            x, y = 240, 1095
        adb("shell", "input", "tap", str(x), str(y))

    if adb("get-state").strip() != "device":
        raise RuntimeError("The selected device is not ready")
    open_app()
    before = wait_for(app_total, "the app's ml total")
    adb("shell", "input", "keyevent", "3")
    button_label = "+" + amount_label(args.amount_ml)
    wait_for(lambda root: find(root, button_label), "the selected widget glass")
    if args.cold:
        adb("shell", "am", "kill", PACKAGE)
    expected = before
    for _ in range(args.taps):
        root = hierarchy()
        tap_button(root, button_label)
        expected += args.amount_ml
        wait_for(lambda root: find(root, amount_label(expected)), f"widget total {expected} ml")
    open_app()
    wait_for(lambda root: expected if app_total(root) == expected else None,
             f"app total {expected} ml")
    print(json.dumps({"result": "passed", "serial": args.serial, "beforeMl": before,
                      "afterMl": expected, "taps": args.taps, "cold": args.cold}))


if __name__ == "__main__":
    main()
