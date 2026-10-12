/* global __dirname */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {
  verifyGeneratedSources,
  verifyArtifact,
  stampRelease,
} = require('./verify-android-release.cjs');

const root = path.resolve(__dirname, '..');
const generatedFirebase = path.join(root, 'android/app/src/release/google-services.json');
let ownsFirebase = false;
try {
  const config = verifyGeneratedSources();
  if (fs.existsSync(generatedFirebase))
    throw new Error('Existing release Firebase override found; refusing to overwrite it.');
  // Use a temporary generated config for the isolated test package. Never
  // modify the user's Firebase config or print credentials. Telemetry remains
  // opt-in; validation builds must not upload Crashlytics release mappings.
  const firebase = JSON.parse(fs.readFileSync(path.join(root, 'google-services.json'), 'utf8'));
  const client = firebase.client.find(
    (item) => item.client_info.android_client_info.package_name === config.android.package,
  );
  if (!client) throw new Error('Production Firebase client not found.');
  const validationClient = JSON.parse(JSON.stringify(client));
  validationClient.client_info.android_client_info.package_name += '.syncvalidation';
  firebase.client.push(validationClient);
  fs.mkdirSync(path.dirname(generatedFirebase), { recursive: true });
  fs.writeFileSync(generatedFirebase, JSON.stringify(firebase));
  ownsFirebase = true;
  stampRelease(true);
  const result = spawnSync(
    './gradlew',
    [
      ':app:assembleRelease',
      '--console=plain',
      '--max-workers=2',
      '-PwaterReminderSyncValidation=true',
      '-Pandroid.enableMinifyInReleaseBuilds=true',
      '-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=768m',
      '-x',
      ':app:uploadCrashlyticsMappingFileRelease',
    ],
    { cwd: path.join(root, 'android'), stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Validation build failed.');
  const output = path.join(
    root,
    'android/app/build/outputs/sync-validation/app-syncvalidation.apk',
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(path.join(root, 'android/app/build/outputs/apk/release/app-release.apk'), output);
  console.log(JSON.stringify(verifyArtifact(output, true), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (ownsFirebase) fs.unlinkSync(generatedFirebase);
}
