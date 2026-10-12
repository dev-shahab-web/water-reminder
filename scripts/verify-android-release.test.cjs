const { test } = require('node:test');
const { Buffer } = require('node:buffer');
const assert = require('node:assert/strict');
const { assertSharedEngine, engineSignature } = require('./verify-android-release.cjs');
const { assertIntegrity } = require('./verify-android-release.cjs');
const { verifyGeneratedSources } = require('./verify-android-release.cjs');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('rejects stale generated Kotlin even when the template contains the fix', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'water-release-test-'));
  try {
    fs.writeFileSync(
      path.join(directory, 'app.json'),
      JSON.stringify({
        expo: { version: '2.0.2', android: { package: 'com.example.water', versionCode: 8 } },
      }),
    );
    const templates = path.join(directory, 'plugins/water-reminder-widget/android/java');
    const generated = path.join(directory, 'android/app/src/main/java/com/example/water/widgets');
    fs.mkdirSync(templates, { recursive: true });
    fs.mkdirSync(generated, { recursive: true });
    fs.writeFileSync(
      path.join(templates, 'WidgetDatabase.kt'),
      'package __PACKAGE__.widgets\n// new engine',
    );
    fs.writeFileSync(
      path.join(generated, 'WidgetDatabase.kt'),
      'package com.example.water.widgets\n// stale',
    );
    assert.throws(() => verifyGeneratedSources(directory), /Generated WidgetDatabase.kt is stale/);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});

test('never accepts a validation clone as a production release', () => {
  const expected = {
    applicationId: 'com.shahab.waterreminder',
    version: '2.0.2',
    versionCode: 8,
    sourceSha256: 'current',
  };
  assert.throws(
    () =>
      assertIntegrity(
        { ...expected, applicationId: expected.applicationId + '.syncvalidation' },
        expected,
        'clone.apk',
      ),
    /fingerprint\/version/,
  );
});

test('rejects same-version artifacts built from different sources', () => {
  const expected = { version: '2.0.2', versionCode: 8, sourceSha256: 'current' };
  assert.throws(
    () => assertIntegrity({ ...expected, sourceSha256: 'old' }, expected, 'old.aab'),
    /fingerprint/,
  );
});
test('rejects a reused version code and accepts matching build metadata', () => {
  const expected = { version: '2.0.2', versionCode: 8, sourceSha256: 'current' };
  assert.throws(
    () => assertIntegrity({ ...expected, versionCode: 7 }, expected, 'old.aab'),
    /version/,
  );
  assert.doesNotThrow(() => assertIntegrity({ ...expected }, expected, 'new.aab'));
});

test('rejects the old Android SQLite release instead of accepting its version number', () => {
  assert.throws(
    () => assertSharedEngine(Buffer.from('SQLiteDatabase.openDatabase'), 'old.aab'),
    /shared Expo SQLite adapter missing/,
  );
});
test('accepts the shared-engine compiled marker in release DEX', () => {
  assert.doesNotThrow(() =>
    assertSharedEngine(Buffer.from(`dex\0${engineSignature}\0`), 'new.aab'),
  );
});
test('does not confuse Expo default busy timeout with the widget adapter', () => {
  assert.throws(
    () => assertSharedEngine(Buffer.from('PRAGMA busy_timeout=0;'), 'old.apk'),
    /stale artifact/,
  );
});
