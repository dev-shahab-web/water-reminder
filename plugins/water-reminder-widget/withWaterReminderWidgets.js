const fs = require('fs');
const path = require('path');

const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  withProjectBuildGradle,
  withStringsXml,
} = require('expo/config-plugins');

const widgetDependencies = [
  'implementation("androidx.glance:glance-appwidget:1.1.1")',
  'implementation("androidx.glance:glance-material3:1.1.1")',
  'implementation("androidx.work:work-runtime-ktx:2.10.0")',
];

const widgetReceiverName = '.widgets.WaterReminderWidgetReceiver';

const withWidgetProjectBuildGradle = (config) =>
  withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error('Water Reminder widgets expect a Groovy Android project build.gradle.');
    }

    const dependency = "classpath('org.jetbrains.kotlin:compose-compiler-gradle-plugin')";
    let contents = gradleConfig.modResults.contents;

    if (!contents.includes(dependency)) {
      contents = contents.replace(
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
        `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')\n    ${dependency}`,
      );
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });

const copyTemplateDirectory = ({ packageName, projectRoot }) => {
  const sourceRoot = path.join(__dirname, 'android');
  const destinationRoot = path.join(projectRoot, 'android', 'app', 'src', 'main');
  const packagePath = packageName.split('.').join(path.sep);

  const copyRecursive = (source, destination) => {
    for (const item of fs.readdirSync(source, { withFileTypes: true })) {
      const sourcePath = path.join(source, item.name);
      const destinationPath = path.join(destination, item.name);

      if (item.isDirectory()) {
        fs.mkdirSync(destinationPath, { recursive: true });
        copyRecursive(sourcePath, destinationPath);
        continue;
      }

      let contents = fs.readFileSync(sourcePath, 'utf8');
      contents = contents.replaceAll('__PACKAGE__', packageName);
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.writeFileSync(destinationPath, contents);
    }
  };

  copyRecursive(path.join(sourceRoot, 'res'), path.join(destinationRoot, 'res'));
  copyRecursive(
    path.join(sourceRoot, 'java'),
    path.join(destinationRoot, 'java', packagePath, 'widgets'),
  );
};

const withWidgetDependencies = (config) =>
  withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error('Water Reminder widgets expect a Groovy Android app build.gradle.');
    }

    let contents = gradleConfig.modResults.contents;

    if (!contents.includes('apply plugin: "org.jetbrains.kotlin.plugin.compose"')) {
      contents = contents.replace(
        'apply plugin: "org.jetbrains.kotlin.android"',
        'apply plugin: "org.jetbrains.kotlin.android"\napply plugin: "org.jetbrains.kotlin.plugin.compose"',
      );
    }

    if (!contents.includes('compose true')) {
      contents = contents.replace(
        /android\s*\{/,
        `android {\n    buildFeatures {\n        compose true\n    }`,
      );
    }

    for (const dependency of widgetDependencies) {
      if (!contents.includes(dependency)) {
        contents = contents.replace(/dependencies\s*\{/, `dependencies {\n    ${dependency}`);
      }
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });

const withWidgetReceiver = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
    const receivers = application.receiver ?? [];
    const hasReceiver = receivers.some(
      (receiver) => receiver.$?.['android:name'] === widgetReceiverName,
    );

    if (!hasReceiver) {
      receivers.push({
        $: {
          'android:exported': 'true',
          'android:label': '@string/water_reminder_widget_name',
          'android:name': widgetReceiverName,
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/water_reminder_widget_info',
            },
          },
        ],
      });
    }

    application.receiver = receivers;
    return manifestConfig;
  });

const withWidgetStrings = (config) =>
  withStringsXml(config, (stringsConfig) => {
    const strings = stringsConfig.modResults.resources.string ?? [];
    const ensureString = (name, value) => {
      const existing = strings.find((item) => item.$?.name === name);

      if (existing) {
        existing._ = value;
        return;
      }

      strings.push({ _: value, $: { name } });
    };

    ensureString('water_reminder_widget_name', 'Water Reminder');
    ensureString(
      'water_reminder_widget_description',
      "See today's hydration and log water from your home screen.",
    );

    stringsConfig.modResults.resources.string = strings;
    return stringsConfig;
  });

const withWidgetMainApplicationPackage = (config) =>
  withMainApplication(config, (mainApplicationConfig) => {
    const packageName =
      AndroidConfig.Package.getPackage(mainApplicationConfig.modRequest.projectRoot) ??
      config.android?.package;

    if (!packageName) {
      throw new Error('Water Reminder widgets require an Android package name.');
    }

    let contents = mainApplicationConfig.modResults.contents;
    const importLine = `import ${packageName}.widgets.WaterReminderWidgetPackage`;
    const packageLine = 'add(WaterReminderWidgetPackage())';

    if (!contents.includes(importLine)) {
      contents = contents.replace(
        'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint',
        `import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint\n${importLine}`,
      );
    }

    if (!contents.includes(packageLine)) {
      contents = contents.replace(
        '// add(MyReactNativePackage())',
        `// add(MyReactNativePackage())\n          ${packageLine}`,
      );
    }

    mainApplicationConfig.modResults.contents = contents;
    return mainApplicationConfig;
  });

const withWidgetTemplates = (config) =>
  withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      const packageName = dangerousConfig.android?.package;

      if (!packageName) {
        throw new Error('Water Reminder widgets require an Android package name.');
      }

      copyTemplateDirectory({
        packageName,
        projectRoot: dangerousConfig.modRequest.projectRoot,
      });

      return dangerousConfig;
    },
  ]);

module.exports = function withWaterReminderWidgets(config) {
  config = withWidgetProjectBuildGradle(config);
  config = withWidgetDependencies(config);
  config = withWidgetReceiver(config);
  config = withWidgetStrings(config);
  config = withWidgetMainApplicationPackage(config);
  config = withWidgetTemplates(config);

  return config;
};
