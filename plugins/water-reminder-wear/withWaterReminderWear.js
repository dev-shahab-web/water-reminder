const fs = require('node:fs');
const path = require('node:path');
const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  withSettingsGradle,
} = require('expo/config-plugins');

module.exports = function withWaterReminderWear(config) {
  config = withSettingsGradle(config, (mod) => {
    if (!mod.modResults.contents.includes("include ':wear'"))
      mod.modResults.contents +=
        "\ninclude ':wear'\nproject(':wear').projectDir = new File(rootDir, '../wear')\n";
    return mod;
  });
  config = withAppBuildGradle(config, (mod) => {
    // Data Layer authenticates package + signing certificate. Persist signing
    // through Expo regeneration so both artifacts use the same release key.
    if (!mod.modResults.contents.includes('waterReminderReleaseSigning')) {
      mod.modResults.contents += `
// waterReminderReleaseSigning
def waterSigningFile = rootProject.file('../keystore.properties')
def waterSigning = new Properties()
if (waterSigningFile.exists()) waterSigningFile.withInputStream { waterSigning.load(it) }
android.signingConfigs.create('release') {
    if (waterSigningFile.exists()) {
        storeFile file(waterSigning['storeFile'])
        storePassword waterSigning['storePassword']
        keyAlias waterSigning['keyAlias']
        keyPassword waterSigning['keyPassword']
    }
}
android.buildTypes.release.signingConfig = android.signingConfigs.release
tasks.matching { it.name == 'validateSigningRelease' }.configureEach {
    doFirst { if (!waterSigningFile.exists()) throw new GradleException('Release signing requires the existing keystore.properties.') }
}
`;
    }
    for (const dependency of [
      'implementation("com.google.android.gms:play-services-wearable:20.0.1")',
      'implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.10.2")',
    ]) {
      if (!mod.modResults.contents.includes(dependency))
        mod.modResults.contents = mod.modResults.contents.replace(
          /dependencies\s*\{/,
          `dependencies {\n    ${dependency}`,
        );
    }
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    const importLine = `import ${config.android.package}.wear.WaterReminderWearPackage`;
    if (!mod.modResults.contents.includes(importLine))
      mod.modResults.contents = mod.modResults.contents.replace(
        /(package [^\n]+\n)/,
        `$1\n${importLine}\n`,
      );
    if (!mod.modResults.contents.includes('add(WaterReminderWearPackage())'))
      mod.modResults.contents = mod.modResults.contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(WaterReminderWearPackage())',
      );
    if (!mod.modResults.contents.includes('add(WaterReminderWearPackage())'))
      throw new Error('Could not register the Wear OS bridge.');
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const services = application.service ?? [];
    const name = '.wear.PhoneWearListenerService';
    if (!services.some((service) => service.$['android:name'] === name))
      services.push({
        $: { 'android:name': name, 'android:exported': 'true' },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'com.google.android.gms.wearable.CAPABILITY_CHANGED' } },
            ],
            data: [{ $: { 'android:scheme': 'wear', 'android:host': '*' } }],
          },
          {
            action: [
              { $: { 'android:name': 'com.google.android.gms.wearable.DATA_CHANGED' } },
              { $: { 'android:name': 'com.google.android.gms.wearable.MESSAGE_RECEIVED' } },
            ],
            data: [
              {
                $: {
                  'android:scheme': 'wear',
                  'android:host': '*',
                  'android:pathPrefix': '/water/v1/',
                },
              },
            ],
          },
        ],
      });
    application.service = services;
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const project = mod.modRequest.projectRoot;
      const root = path.join(project, 'android/app/src/main');
      const destination = path.join(root, 'java', ...config.android.package.split('.'), 'wear');
      fs.mkdirSync(destination, { recursive: true });
      for (const file of fs.readdirSync(path.join(__dirname, 'android'))) {
        fs.writeFileSync(
          path.join(destination, file),
          fs
            .readFileSync(path.join(__dirname, 'android', file), 'utf8')
            .replaceAll('__PACKAGE__', config.android.package),
        );
      }
      const protocol = path.join(root, 'java/com/shahab/waterreminder/wear/protocol');
      fs.mkdirSync(protocol, { recursive: true });
      for (const file of fs.readdirSync(path.join(project, 'wear-protocol')))
        if (file.endsWith('.kt'))
          fs.copyFileSync(path.join(project, 'wear-protocol', file), path.join(protocol, file));
      fs.mkdirSync(path.join(root, 'res/values'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'res/values/wear_capabilities.xml'),
        '<resources><string-array name="android_wear_capabilities"><item>water_reminder_phone_v1</item></string-array></resources>',
      );
      fs.mkdirSync(path.join(root, 'res/raw'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'res/raw/wear_keep.xml'),
        '<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="@array/android_wear_capabilities" />',
      );
      return mod;
    },
  ]);
};
