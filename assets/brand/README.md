# Water Reminder Brand Assets

`water-reminder-mark.svg` is the editable source brand mark for Water Reminder.

The Expo icon and splash configuration point at raster PNG paths because Expo and Android native builds require generated image assets. Keep these files synchronized with the SVG source before store submission:

- `assets/images/icon.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/splash-icon.png`

Widget branding uses a native vector drawable in the Android widget config-plugin template:

- `plugins/water-reminder-widget/android/res/drawable/water_reminder_widget_mark.xml`

Do not edit generated Android output as the icon source of truth. Update the source SVG, configured PNGs, and widget drawable template together when the brand mark changes.
