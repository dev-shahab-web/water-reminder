# Screenshot capture evidence — October 20–21, 2026

- Physical Samsung Galaxy Watch4 Classic SM-R895F, native 450×450 screen.
- Phone package/version: com.shahab.waterreminder, 2.0.4 (10).
- Watch package/version: com.shahab.waterreminder, 1.0.0 (1000010).
- ADB transport changed from 192.168.1.16:44443 to 192.168.1.16:45725 after wireless debugging reconnected.
- The previous Play test plan expired. The watch showed the Plus-required screen and Restore on the phone reported no active Plus plan.
- User authorized a new test purchase. Checkout showed “Test card, always approves” and “This is a test subscription ... You will not be charged.” Subscribe succeeded, followed by Welcome to Plus and access on the paired watch.
- A 500 mL picker drink was logged on October 20 for the synced Undo, Jade, tile, and complication captures. The complication showed the droplet and 50%, matching 1000/2000 mL.
- Midnight/day rollover was observed: the watch dashboard changed from 1000 mL on October 20 to 0 mL on October 21. This is one observed rollover, not a long-duration battery or offline-entitlement test.
- A 250 mL drink was added with the phone Wi-Fi, mobile data, and Bluetooth disabled. Phone call states were idle before this step. The 250 mL total survived watch process restart; the watch showed “1 saved on watch.” All three phone radios were restored to their original enabled state in a finally block.
- The source screenshots are unaltered device captures. Upload versions are opaque RGB PNGs with the same UI pixels. The local contact sheet contains labels only for review.

Final cleanup and setting restoration are recorded in capture-verification.json after completion.

- Final cleanup used the phone history UI while the watch remained locked: the 00:07 250 mL watch entry on October 21 and the 23:43 500 mL watch entry on October 20 were removed. Phone history verified October 21 empty and October 20 at the original 500 mL with two original entries.
- Ocean and millilitres were restored. The phone radios remained enabled. Watch timeout was restored to 60000, stay-awake to 2, and font scale verified as 1.0. Watch security settings were unchanged.
- Seven upload screenshots cover the intended feature set. Ounces appear on the live tile; the dashboard image captured during an in-flight unit update was excluded.
