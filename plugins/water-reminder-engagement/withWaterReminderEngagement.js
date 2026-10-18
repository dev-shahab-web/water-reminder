const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

module.exports = function withWaterReminderEngagement(config) {
  config = withAppBuildGradle(config, (mod) => {
    for (const dependency of [
      'implementation("com.google.android.play:app-update:2.1.0")',
      'implementation("androidx.work:work-runtime-ktx:2.10.1")',
      'testImplementation("junit:junit:4.13.2")',
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
    const importLine = `import ${config.android.package}.engagement.WaterReminderEngagementPackage`;
    if (!mod.modResults.contents.includes(importLine))
      mod.modResults.contents = mod.modResults.contents.replace(
        /(package [^\n]+\n)/,
        `$1\n${importLine}\n`,
      );
    if (!mod.modResults.contents.includes('add(WaterReminderEngagementPackage())'))
      mod.modResults.contents = mod.modResults.contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(WaterReminderEngagementPackage())',
      );
    if (!mod.modResults.contents.includes('add(WaterReminderEngagementPackage())'))
      throw new Error('Could not register WaterReminderEngagementPackage.');
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const destination = path.join(
        mod.modRequest.projectRoot,
        'android/app/src/main/java',
        ...config.android.package.split('.'),
        'engagement',
      );
      fs.mkdirSync(destination, { recursive: true });
      for (const file of fs.readdirSync(path.join(__dirname, 'android')))
        fs.writeFileSync(
          path.join(destination, file),
          fs
            .readFileSync(path.join(__dirname, 'android', file), 'utf8')
            .replaceAll('__PACKAGE__', config.android.package),
        );
      const testDestination = path.join(
        mod.modRequest.projectRoot,
        'android/app/src/test/java',
        ...config.android.package.split('.'),
        'engagement',
      );
      fs.mkdirSync(testDestination, { recursive: true });
      for (const file of fs.readdirSync(path.join(__dirname, 'android-test')))
        fs.writeFileSync(
          path.join(testDestination, file),
          fs
            .readFileSync(path.join(__dirname, 'android-test', file), 'utf8')
            .replaceAll('__PACKAGE__', config.android.package),
        );
      return mod;
    },
  ]);
};
