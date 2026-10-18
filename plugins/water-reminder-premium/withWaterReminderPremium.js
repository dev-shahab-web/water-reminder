const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

const variants = {
  midnight: '#142738',
  jade: '#174B43',
  rose: '#613B50',
  violet: '#46365D',
  expressive: '#006B5A',
};

module.exports = function withWaterReminderPremium(config) {
  config = withAppBuildGradle(config, (mod) => {
    const dependency = 'implementation("com.android.billingclient:billing-ktx:8.0.0")';
    if (!mod.modResults.contents.includes(dependency))
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${dependency}`,
      );
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    const importLine = `import ${config.android.package}.premium.WaterReminderPremiumPackage`;
    if (!mod.modResults.contents.includes(importLine))
      mod.modResults.contents = mod.modResults.contents.replace(
        /(package [^\n]+\n)/,
        `$1\n${importLine}\n`,
      );
    if (!mod.modResults.contents.includes('add(WaterReminderPremiumPackage())'))
      mod.modResults.contents = mod.modResults.contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(WaterReminderPremiumPackage())',
      );
    if (!mod.modResults.contents.includes('add(WaterReminderPremiumPackage())'))
      throw new Error('Could not register WaterReminderPremiumPackage.');
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const permissions = manifest['uses-permission'] ?? [];
    if (
      !permissions.some(
        (permission) => permission.$['android:name'] === 'com.android.vending.BILLING',
      )
    )
      permissions.push({ $: { 'android:name': 'com.android.vending.BILLING' } });
    manifest['uses-permission'] = permissions;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const main = application.activity.find(
      (activity) => activity.$['android:name'] === '.MainActivity',
    );
    // Launcher aliases can be switched without disabling the activity used by
    // deep links, notifications and widgets.
    main['intent-filter'] = (main['intent-filter'] ?? []).filter(
      (filter) =>
        !filter.category?.some(
          (category) => category.$['android:name'] === 'android.intent.category.LAUNCHER',
        ),
    );
    const aliases = application['activity-alias'] ?? [];
    for (const name of ['default', ...Object.keys(variants)]) {
      const aliasName = `.premium.Icon${name[0].toUpperCase()}${name.slice(1)}`;
      if (aliases.some((alias) => alias.$['android:name'] === aliasName)) continue;
      aliases.push({
        $: {
          'android:name': aliasName,
          'android:targetActivity': '.MainActivity',
          'android:enabled': name === 'default' ? 'true' : 'false',
          'android:exported': 'true',
          'android:label': '@string/app_name',
          'android:icon':
            name === 'default' ? '@mipmap/ic_launcher' : `@drawable/premium_icon_${name}`,
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }
    application['activity-alias'] = aliases;
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const root = path.join(mod.modRequest.projectRoot, 'android/app/src/main');
      const destination = path.join(root, 'java', ...config.android.package.split('.'), 'premium');
      fs.mkdirSync(destination, { recursive: true });
      for (const file of fs.readdirSync(path.join(__dirname, 'android'))) {
        fs.writeFileSync(
          path.join(destination, file),
          fs
            .readFileSync(path.join(__dirname, 'android', file), 'utf8')
            .replaceAll('__PACKAGE__', config.android.package),
        );
      }
      const drawable = path.join(root, 'res/drawable');
      fs.mkdirSync(drawable, { recursive: true });
      for (const [name, color] of Object.entries(variants)) {
        fs.writeFileSync(
          path.join(drawable, `premium_icon_${name}.xml`),
          `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="${color}" android:pathData="M0,0h108v108h-108z" />
  <path android:fillColor="#EED6A3" android:pathData="M54,23C49,36 32,51 32,65A22,22 0,0 0,76 65C76,51 59,36 54,23Z" />
  <path android:strokeColor="#FFF8E8" android:strokeWidth="3" android:strokeLineCap="round" android:fillColor="@android:color/transparent" android:pathData="M41,62C39,72 45,78 51,79" />
</vector>`,
        );
      }
      return mod;
    },
  ]);
};
