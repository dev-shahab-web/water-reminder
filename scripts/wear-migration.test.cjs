/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/platform/database/migrations.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const migrationModule = { exports: {} };
new Function('exports', 'module', compiled)(migrationModule.exports, migrationModule);
const { runDatabaseMigrations } = migrationModule.exports;

function adapter(db) {
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    getAllAsync: async (sql, args) => db.prepare(sql).all(...args),
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) ?? null,
  };
}

test('fresh and repeat migrations accept watch drinks and preserve the deletion trigger', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    await runDatabaseMigrations(adapter(db));
    await runDatabaseMigrations(adapter(db));
    db.exec(
      "INSERT INTO hydration_entries(id,timestamp,amount,source,createdAt,updatedAt) VALUES('wear_test','2026-10-20',250,'wear_os','2026-10-20','2026-10-20')",
    );
    db.exec("DELETE FROM hydration_entries WHERE id='wear_test'");
    const deletion = db.prepare('SELECT * FROM health_connect_deletions').get();
    assert.equal(deletion.clientRecordId, 'wear_test');
    assert.equal(deletion.deleteRemote, 1);
  } finally {
    db.close();
  }
});

test('upgrades widget-era databases with reordered columns without losing Health Connect ids', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE hydration_entries (
      id TEXT PRIMARY KEY, amount INTEGER, timestamp TEXT,
      source TEXT CHECK(source IN ('quick_add','custom','edit','health_connect','widget')),
      updatedAt TEXT, createdAt TEXT, healthConnectSyncedAt TEXT,
      healthConnectDataOrigin TEXT, healthConnectClientRecordId TEXT UNIQUE, healthConnectRecordId TEXT UNIQUE
    ); INSERT INTO hydration_entries VALUES('old',500,'2026-10-20','widget','updated','created','synced','origin','client','record');`);
    const before = { ...db.prepare('SELECT * FROM hydration_entries').get() };
    await runDatabaseMigrations(adapter(db));
    assert.deepEqual({ ...db.prepare('SELECT * FROM hydration_entries').get() }, before);
    assert.ok(
      db
        .prepare("SELECT sql FROM sqlite_master WHERE name='hydration_entries'")
        .get()
        .sql.includes('wear_os'),
    );
    assert.ok(
      db
        .prepare("SELECT name FROM sqlite_master WHERE name='idx_hydration_entries_timestamp'")
        .get(),
    );
  } finally {
    db.close();
  }
});

test('a failed watch migration rolls back the original table and rows', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    await runDatabaseMigrations(adapter(db));
    const schema = db
      .prepare("SELECT sql FROM sqlite_master WHERE name='hydration_entries'")
      .get().sql;
    db.exec('DROP TABLE hydration_entries');
    db.exec(schema.replace(", 'wear_os'", '').replace('CHECK (amount > 0)', 'CHECK (amount >= 0)'));
    db.exec(
      "INSERT INTO hydration_entries(id,timestamp,amount,source,createdAt,updatedAt) VALUES('legacy','2026-10-20',0,'widget','created','updated')",
    );
    await assert.rejects(runDatabaseMigrations(adapter(db)), /CHECK constraint failed/);
    assert.equal(db.prepare('SELECT amount FROM hydration_entries').get().amount, 0);
    assert.equal(
      db.prepare("SELECT name FROM sqlite_master WHERE name='hydration_entries_wear'").get(),
      undefined,
    );
  } finally {
    db.close();
  }
});
