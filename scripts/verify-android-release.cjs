/* global __dirname */
const { execFileSync } = require('node:child_process');
const { Buffer } = require('node:buffer');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const engineSignature =
  'PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;';

function assertSharedEngine(dex, label) {
  if (!dex.includes(Buffer.from(engineSignature))) {
    throw new Error(
      `${label}: shared Expo SQLite adapter missing. Do not upload this stale artifact.`,
    );
  }
}

function verifyGeneratedSources(projectRoot = root) {
  const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8')).expo;
  const templates = path.join(projectRoot, 'plugins/water-reminder-widget/android/java');
  const generated = path.join(
    projectRoot,
    'android/app/src/main/java',
    ...config.android.package.split('.'),
    'widgets',
  );
  for (const name of fs.readdirSync(templates).filter((name) => name.endsWith('.kt'))) {
    const expected = fs
      .readFileSync(path.join(templates, name), 'utf8')
      .replaceAll('__PACKAGE__', config.android.package);
    if (
      !fs.existsSync(path.join(generated, name)) ||
      fs.readFileSync(path.join(generated, name), 'utf8') !== expected
    ) {
      throw new Error(
        `Generated ${name} is stale. Run npm run prebuild, then restore your signing configuration if needed.`,
      );
    }
  }
  for (const name of ['WidgetHydrationWriter.kt', 'WidgetHealthSyncWorker.kt']) {
    const source = fs.readFileSync(path.join(templates, name), 'utf8');
    if (
      source.includes('android.database.sqlite.SQLiteDatabase') ||
      !source.includes('WidgetDatabase')
    ) {
      throw new Error(`${name} must use the same SQLite engine as Expo.`);
    }
  }
  const gradle = fs.readFileSync(path.join(projectRoot, 'android/app/build.gradle'), 'utf8');
  if (
    !gradle.includes(`versionCode ${config.android.versionCode}`) ||
    !gradle.includes(`versionName "${config.version}"`)
  ) {
    throw new Error(
      'Generated Android version differs from app.json. Refusing a misidentified release.',
    );
  }
  return config;
}

function verifyArtifact(file, validation = false) {
  const entryPattern = file.endsWith('.aab') ? 'base/dex/classes*.dex' : 'classes*.dex';
  const dex = execFileSync('unzip', ['-p', file, entryPattern], { maxBuffer: 128 * 1024 * 1024 });
  assertSharedEngine(dex, file);
  const asset = file.endsWith('.aab')
    ? 'base/assets/release-integrity.json'
    : 'assets/release-integrity.json';
  const integrity = JSON.parse(execFileSync('unzip', ['-p', file, asset], { encoding: 'utf8' }));
  const expected = releaseIntegrity(validation);
  assertIntegrity(integrity, expected, file);
  return {
    file: path.relative(root, file),
    sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    sqliteEngine: 'expo-shared',
  };
}

function assertIntegrity(actual, expected, label) {
  if (
    actual.version !== expected.version ||
    actual.applicationId !== expected.applicationId ||
    actual.versionCode !== expected.versionCode ||
    actual.sourceSha256 !== expected.sourceSha256
  ) {
    throw new Error(
      `${label}: build fingerprint/version differs from current sources. Rebuild with npm run android:release.`,
    );
  }
}

function releaseIntegrity(validation = false) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
  const hash = createHash('sha256');
  function visit(relative) {
    const full = path.join(root, relative);
    if (fs.statSync(full).isDirectory()) {
      for (const name of fs.readdirSync(full).sort()) visit(path.join(relative, name));
    } else if (!/\.(test|spec)\./.test(relative)) {
      hash.update(relative).update('\0').update(fs.readFileSync(full)).update('\0');
    }
  }
  for (const name of ['src', 'plugins', 'app', 'app.json', 'package.json', 'package-lock.json'])
    visit(name);
  return {
    applicationId: config.android.package + (validation ? '.syncvalidation' : ''),
    version: config.version,
    versionCode: config.android.versionCode,
    sourceSha256: hash.digest('hex'),
  };
}

function stampRelease(validation = false) {
  const assets = path.join(root, 'android/app/src/main/assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(
    path.join(assets, 'release-integrity.json'),
    JSON.stringify(releaseIntegrity(validation)),
  );
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--sources')) {
    verifyGeneratedSources();
    console.log('Generated widget sources and release versions verified.');
    return;
  }
  const files = args.length
    ? args.map((file) => path.resolve(file))
    : [
        path.join(root, 'android/app/build/outputs/apk/release/app-release.apk'),
        path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab'),
      ];
  console.log(
    JSON.stringify(
      files.map((file) => verifyArtifact(file)),
      null,
      2,
    ),
  );
}

module.exports = {
  assertIntegrity,
  assertSharedEngine,
  engineSignature,
  verifyGeneratedSources,
  verifyArtifact,
  stampRelease,
};
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
