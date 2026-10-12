/* global __dirname */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const {
  verifyGeneratedSources,
  verifyArtifact,
  stampRelease,
} = require('./verify-android-release.cjs');

const root = path.resolve(__dirname, '..');
try {
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
    { cwd: path.join(root, 'android'), stdio: 'inherit' },
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
