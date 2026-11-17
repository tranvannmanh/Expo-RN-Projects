import { createTestDatabase } from '../../../../jest/sqliteTestDatabase';
import { LATEST_SCHEMA_VERSION, migrateDatabase } from '../migrations';

async function userVersion(db: ReturnType<typeof createTestDatabase>) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version;
}

describe('migrateDatabase', () => {
  it('creates the v1 schema on a fresh database', async () => {
    const db = createTestDatabase();
    await migrateDatabase(db);

    expect(await userVersion(db)).toBe(LATEST_SCHEMA_VERSION);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(['document_pages', 'documents']);
  });

  it('is idempotent', async () => {
    const db = createTestDatabase();
    await migrateDatabase(db);
    await migrateDatabase(db);
    expect(await userVersion(db)).toBe(LATEST_SCHEMA_VERSION);
  });

  it('refuses a database created by a newer app version', async () => {
    const db = createTestDatabase();
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION + 1}`);
    await expect(migrateDatabase(db)).rejects.toThrow(/newer than this app supports/);
  });
});
