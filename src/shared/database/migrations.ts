import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered, append-only schema migrations. Index + 1 is the schema version stored in
 * `PRAGMA user_version`. Never edit a released migration — add a new one instead.
 */
export const MIGRATIONS: readonly string[] = [
  // v1 — documents and their pages
  `
  CREATE TABLE documents (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    pdf_path    TEXT,
    page_count  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE document_pages (
    id               TEXT PRIMARY KEY NOT NULL,
    document_id      TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number      INTEGER NOT NULL,
    original_path    TEXT,
    processed_path   TEXT NOT NULL,
    is_blank         INTEGER,
    sharpness_score  REAL,
    created_at       INTEGER NOT NULL,
    UNIQUE (document_id, page_number)
  );

  CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
  `,
  // v2 — PDF Tools: imported PDFs and the results of compress/merge/split/watermark
  `
  CREATE TABLE pdf_files (
    id              TEXT PRIMARY KEY NOT NULL,
    name            TEXT NOT NULL,
    path            TEXT NOT NULL UNIQUE,
    size_bytes      INTEGER NOT NULL,
    page_count      INTEGER NOT NULL,
    source          TEXT NOT NULL
                    CHECK (source IN ('import', 'document', 'compress', 'merge', 'split', 'watermark')),
    thumbnail_path  TEXT,
    created_at      INTEGER NOT NULL
  );

  CREATE INDEX idx_pdf_files_created_at ON pdf_files(created_at DESC);
  `,
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Database schema v${currentVersion} is newer than this app supports (v${LATEST_SCHEMA_VERSION})`,
    );
  }

  for (let version = currentVersion; version < LATEST_SCHEMA_VERSION; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      // PRAGMA does not accept bound parameters; `version` is a trusted integer.
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
