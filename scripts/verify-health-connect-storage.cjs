const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

// Exercise the actual migration/repository SQL against SQLite, including the
// durable outbox and concurrent edit/delete acknowledgements.
const sqlite = new DatabaseSync(':memory:');
const database = {
  execAsync: async (sql) => sqlite.exec(sql),
  getAllAsync: async (sql, parameters = []) => sqlite.prepare(sql).all(...parameters),
  getFirstAsync: async (sql, parameters = []) => sqlite.prepare(sql).get(...parameters) ?? null,
  runAsync: async (sql, parameters = []) => sqlite.prepare(sql).run(...parameters),
};

function loadModule(filename, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(
    source,
    {
      exports,
      require: (name) => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
        return dependencies[name];
      },
      Date,
      Math,
      Set,
    },
    { filename },
  );
  return exports;
}

async function main() {
  const { runDatabaseMigrations } = loadModule('src/platform/database/migrations.ts');
  await runDatabaseMigrations(database);
  await runDatabaseMigrations(database);
  const repository = loadModule('src/modules/hydration/repository/hydration-repository.ts', {
    '@platform/database': { getDatabase: async () => database },
    '../utils/date': {},
  });
  const timestamp = '2026-10-08T08:00:00.000Z';
  await repository.addHydrationEntry({ id: 'local', amount: 250, source: 'widget', timestamp });
  const initial = (await repository.getHealthConnectWritableEntries())[0];
  await repository.markHydrationEntriesSyncedToHealthConnect([
    {
      id: 'local',
      healthConnectRecordId: 'remote',
      syncedAt: initial.updatedAt,
      exportedUpdatedAt: initial.updatedAt,
    },
  ]);
  assert.equal((await repository.getHealthConnectWritableEntries()).length, 0);

  await repository.updateHydrationEntry({ id: 'local', amount: 500 });
  assert.equal((await repository.getHealthConnectWritableEntries())[0].amount, 500);
  const editedVersion = (await repository.getHealthConnectWritableEntries())[0].updatedAt;
  await repository.updateHydrationEntry({ id: 'local', amount: 500 });
  assert.ok((await repository.getHealthConnectWritableEntries())[0].updatedAt > editedVersion);
  await repository.markHydrationEntriesSyncedToHealthConnect([
    {
      id: 'local',
      healthConnectRecordId: 'remote',
      syncedAt: timestamp,
      exportedUpdatedAt: 'stale-version',
    },
  ]);
  assert.equal((await repository.getHealthConnectWritableEntries()).length, 1);

  await repository.deleteHydrationEntry('local');
  assert.equal((await repository.getHealthConnectDeletions())[0].clientRecordId, 'local');
  await repository.markHealthConnectDeletionSynced('local');
  await repository.addHydrationEntry({
    id: 'imported-copy',
    amount: 250,
    source: 'health_connect',
    timestamp,
    healthConnectRecordId: 'remote',
    healthConnectClientRecordId: 'local',
    healthConnectDataOrigin: 'com.shahab.waterreminder',
  });
  assert.equal((await repository.getAllHydrationEntries()).length, 0);

  await repository.addHydrationEntry({
    id: 'external',
    amount: 750,
    source: 'health_connect',
    timestamp,
    healthConnectRecordId: 'external-remote',
    healthConnectDataOrigin: 'other.app',
  });
  await repository.deleteAllHydrationEntries();
  assert.equal(
    (await repository.getHealthConnectDeletions()).find((row) => row.entryId === 'external')
      .deleteRemote,
    0,
  );

  await repository.addHydrationEntry({
    id: 'restored',
    amount: 300,
    source: 'quick_add',
    timestamp,
  });
  const restored = await repository.getAllHydrationEntries();
  await repository.replaceHydrationEntries(restored);
  assert.equal(
    (await repository.getHealthConnectDeletions()).some((row) => row.entryId === 'restored'),
    false,
  );
  assert.equal((await repository.getAllHydrationEntries()).length, 1);
  sqlite.close();
  console.log(
    'Health Connect SQLite checks passed: edits, stale acknowledgements, durable removals, import suppression, ownership, restore.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
