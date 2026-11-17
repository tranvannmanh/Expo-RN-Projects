import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from './migrations';

export const DATABASE_NAME = 'scanner.db';

/** Runs once per connection, before any query (SQLiteProvider `onInit`). */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // foreign_keys is per-connection and OFF by default in SQLite.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrateDatabase(db);
}
