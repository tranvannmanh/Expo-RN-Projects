import { createTestDatabase } from '../../../../jest/sqliteTestDatabase';
import { LATEST_SCHEMA_VERSION, MIGRATIONS, migrateDatabase } from '../migrations';

async function userVersion(db: ReturnType<typeof createTestDatabase>) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version;
}

describe('migrateDatabase', () => {
  it('creates the latest schema on a fresh database', async () => {
    const db = createTestDatabase();
    await migrateDatabase(db);

    expect(await userVersion(db)).toBe(LATEST_SCHEMA_VERSION);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(['document_pages', 'documents', 'pdf_files']);
  });

  it('upgrades a v1 database to v2 and keeps existing documents', async () => {
    const db = createTestDatabase();
    await db.execAsync(MIGRATIONS[0]);
    await db.execAsync('PRAGMA user_version = 1');
    await db.runAsync("INSERT INTO documents VALUES ('d', 'Doc', NULL, 0, 1, 1)");

    await migrateDatabase(db);

    expect(await userVersion(db)).toBe(2);
    expect(await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM documents')).toEqual({ n: 1 });
    await expect(
      db.runAsync("INSERT INTO pdf_files VALUES ('p', 'P', 'pdf-files/p.pdf', 1, 1, 'bogus', NULL, 1)"),
    ).rejects.toThrow(/CHECK/);
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
