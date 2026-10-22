/* global __dirname */
const { spawnSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const validation = process.argv.includes('--validation');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
try {
  if (!sdk) throw new Error('Set ANDROID_HOME to your Android SDK.');
  const result = spawnSync(
    './gradlew',
    [
      ':wear:assembleRelease',
      ':wear:bundleRelease',
      ':wear:lintRelease',
      '--console=plain',
      '--max-workers=2',
      ...(validation ? ['-PwaterReminderSyncValidation=true'] : []),
    ],
    { cwd: path.join(root, 'android'), stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Wear OS release build failed.');
  const apk = path.join(root, 'wear/build/outputs/apk/release/wear-release.apk');
  const apkanalyzer = path.join(sdk, 'cmdline-tools/latest/bin/apkanalyzer');
  const manifest = execFileSync(apkanalyzer, ['manifest', 'print', apk], { encoding: 'utf8' });
  const expected = 'com.shahab.waterreminder' + (validation ? '.syncvalidation' : '');
  if (
    !manifest.includes(`package="${expected}"`) ||
    manifest.includes('DebugFixtureActivity') ||
    manifest.includes('android:debuggable="true"')
  )
    throw new Error('Wear release identity/debug isolation check failed.');
  const signingTool = path.join(sdk, 'build-tools/36.0.0/apksigner');
  const digest = (file) =>
    execFileSync(signingTool, ['verify', '--print-certs', file], { encoding: 'utf8' }).match(
      /certificate SHA-256 digest: (\w+)/,
    )?.[1];
  const watchDigest = digest(apk);
  if (!watchDigest) throw new Error('Watch APK signature is missing.');
  const phone = path.join(
    root,
    validation
      ? 'android/app/build/outputs/sync-validation/app-syncvalidation.apk'
      : 'android/app/build/outputs/apk/release/app-release.apk',
  );
  if (fs.existsSync(phone) && digest(phone) !== watchDigest)
    throw new Error('Phone and watch signing certificates differ; Data Layer will not connect.');
  console.log(
    JSON.stringify(
      {
        apk,
        applicationId: expected,
        debugFixtureAbsent: true,
        matchingPhoneCertificate: fs.existsSync(phone) ? true : 'phone artifact not built',
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
