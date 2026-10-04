const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const receiver = '.notifications.WaterReminderNotificationsService';
const actions = [
  'expo.modules.notifications.NOTIFICATION_EVENT',
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.REBOOT',
  'android.intent.action.QUICKBOOT_POWERON',
  'com.htc.intent.action.QUICKBOOT_POWERON',
  'android.intent.action.MY_PACKAGE_REPLACED',
];

// Kept as app sources, never patches node_modules. Expo still owns scheduling,
// permissions, channels, response delivery and request serialization.
module.exports = function withWaterReminderNotifications(config) {
  config = withAndroidManifest(config, (mod) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    app.receiver ??= [];
    if (!app.receiver.some((item) => item.$['android:name'] === receiver)) {
      app.receiver.push({
        $: { 'android:name': receiver, 'android:exported': 'false' },
        'intent-filter': [
          {
            $: { 'android:priority': '1' },
            action: actions.map((name) => ({ $: { 'android:name': name } })),
          },
        ],
      });
    }
    // Leave Expo's lower-priority receiver registered so old pending intents
    // survive an app upgrade; newly scheduled intents use the custom receiver.
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const packageName = mod.android?.package;
      if (!packageName) throw new Error('Notification artwork requires an Android package.');
      const main = path.join(mod.modRequest.platformProjectRoot, 'app/src/main');
      const copy = (source, destination) => {
        fs.mkdirSync(destination, { recursive: true });
        for (const item of fs.readdirSync(source, { withFileTypes: true })) {
          const from = path.join(source, item.name);
          const to = path.join(destination, item.name);
          if (item.isDirectory()) copy(from, to);
          else
            fs.writeFileSync(
              to,
              fs.readFileSync(from, 'utf8').replaceAll('__PACKAGE__', packageName),
            );
        }
      };
      copy(path.join(__dirname, 'android/res'), path.join(main, 'res'));
      copy(
        path.join(__dirname, 'android/java'),
        path.join(main, 'java', ...packageName.split('.'), 'notifications'),
      );
      const vessels = require('../../assets/illustrations/glass-vessels.json');
      for (const [kind, vessel] of Object.entries(vessels)) {
        const stroke = (d, color, width) =>
          `<path android:pathData="${d}" android:strokeColor="${color}" android:strokeWidth="${width}" android:strokeLineCap="round" android:strokeLineJoin="round"/>`;
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" xmlns:aapt="http://schemas.android.com/aapt" android:width="80dp" android:height="88dp" android:viewportWidth="100" android:viewportHeight="112">
${vessel.handle ? stroke(vessel.handle, '#318BC1', 4) : ''}
<path android:pathData="${vessel.body}" android:fillColor="#EFFAFF"/>
<group><clip-path android:pathData="${vessel.body}"/>
<path android:pathData="M8 ${vessel.waterY} Q28 ${vessel.waterY - 6} 49 ${vessel.waterY} T94 ${vessel.waterY} V102 H8 Z">
<aapt:attr name="android:fillColor"><gradient android:startX="20" android:startY="35" android:endX="78" android:endY="98" android:startColor="#67D6FA" android:endColor="#258EEC" android:type="linear"/></aapt:attr>
</path>
${stroke(vessel.highlight, '#CCFFFFFF', 4)}
</group>
${stroke(vessel.body, '#318BC1', 3)}
${stroke(vessel.rim, '#277DAF', 4)}
${kind === 'cup' ? stroke('M20 94 H74', '#318BC1', 3) : ''}
${kind === 'bottle' ? '<path android:pathData="M38 8 H62 V18 H38 Z" android:fillColor="#64C4F1" android:strokeColor="#318BC1" android:strokeWidth="3"/>' : ''}
</vector>`;
        fs.writeFileSync(path.join(main, 'res/drawable', `notification_glass_${kind}.xml`), xml);
      }
      return mod;
    },
  ]);
};
