/* global __dirname */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('@expo/env');
const {
  verifyGeneratedSources,
  verifyArtifact,
  stampRelease,
} = require('./verify-android-release.cjs');

const root = path.resolve(__dirname, '..');
try {
  load(root);
  if (fs.existsSync(path.join(root, '.env'))) {
    fs.copyFileSync(path.join(root, '.env'), path.join(root, 'android/.env'));
  }
  const cachedBundle = path.join(root, 'android/app/build/generated/assets/react/release');
  if (fs.existsSync(cachedBundle)) {
    fs.rmSync(cachedBundle, { recursive: true, force: true });
  }

  // The ignored android directory is not the source of truth. Fail before
  // building if Expo's source-controlled templates were not regenerated.
  const config = verifyGeneratedSources();
  stampRelease();
  const result = spawnSync(
    './gradlew',
    [
      ':app:assembleRelease',
      ':app:bundleRelease',
      '--console=plain',
      '--max-workers=2',
      '-Pandroid.enableMinifyInReleaseBuilds=true',
      '-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=768m',
    ],
    { cwd: path.join(root, 'android'), stdio: 'inherit', env: process.env },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error('Release build failed; do not use previous output files.');
  const artifacts = [
    'android/app/build/outputs/apk/release/app-release.apk',
    'android/app/build/outputs/bundle/release/app-release.aab',
  ].map((file) => verifyArtifact(path.join(root, file)));
  console.log(
    JSON.stringify(
      { version: config.version, versionCode: config.android.versionCode, artifacts },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
