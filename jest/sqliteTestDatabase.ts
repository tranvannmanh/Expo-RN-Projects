import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Real SQLite (Node's built-in `node:sqlite`) behind the subset of the expo-sqlite async API
 * used by the app, so repositories run their actual SQL, constraints and transactions in Jest.
 */
type Row = Record<string, unknown>;
type Param = string | number | null | boolean;

type NodeStatement = {
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Row | undefined;
  all(...params: unknown[]): Row[];
};
type NodeDatabase = {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
};
type NodeSqliteModule = { DatabaseSync: new (path: string) => NodeDatabase };

// getBuiltinModule bypasses Jest's resolver, which does not know prefix-only builtins.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as NodeSqliteModule;

const normalize = (params: Param[]) => params.map((p) => (typeof p === 'boolean' ? Number(p) : p));

type TestDatabaseApi = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: Param[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
  withExclusiveTransactionAsync(task: (txn: TestDatabaseApi) => Promise<void>): Promise<void>;
  close(): void;
};

export function createTestDatabase(): SQLiteDatabase & { close(): void } {
  const native = new DatabaseSync(':memory:');
  let inTransaction = false;

  const api: TestDatabaseApi = {
    async execAsync(sql: string) {
      native.exec(sql);
    },
    async runAsync(sql: string, ...params: Param[]) {
      const result = native.prepare(sql).run(...normalize(params));
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null> {
      return (native.prepare(sql).get(...normalize(params)) ?? null) as T | null;
    },
    async getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]> {
      return native.prepare(sql).all(...normalize(params)) as T[];
    },
    async withExclusiveTransactionAsync(task) {
      if (inTransaction) throw new Error('Nested transactions are not supported');
      inTransaction = true;
      native.exec('BEGIN EXCLUSIVE');
      try {
        await task(api);
        native.exec('COMMIT');
      } catch (error) {
        native.exec('ROLLBACK');
        throw error;
      } finally {
        inTransaction = false;
      }
    },
    close: () => native.close(),
  };

  return api as unknown as SQLiteDatabase & { close(): void };
}
