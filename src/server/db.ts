import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { mkdirSync } from "node:fs";

export interface SQL {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}
type Database = SQL & {
  transaction<T>(fn: (sql: SQL) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};
const globalDB = globalThis as unknown as { madaDatabase?: Database };
export function db(): Database {
  if (globalDB.madaDatabase) return globalDB.madaDatabase;
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
    });
    globalDB.madaDatabase = {
      close: () => pool.end(),
      query: async <T>(sql: string, params?: unknown[]) => ({
        rows: (await pool.query(sql, params)).rows as T[],
      }),
      transaction: async <T>(fn: (sql: SQL) => Promise<T>) => {
        const client = await pool.connect();
        const sql: SQL = {
          query: async <R>(q: string, p?: unknown[]) => ({
            rows: (await client.query(q, p)).rows as R[],
          }),
        };
        try {
          await client.query("BEGIN");
          const result = await fn(sql);
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
    };
  } else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_LOCAL_DATABASE !== "true"
    )
      throw new Error("DATABASE_URL requis en production");
    const location =
      process.env.LOCAL_DATABASE_PATH ||
      path.join(process.cwd(), ".data/postgres");
    if (location !== "memory://")
      mkdirSync(path.dirname(location), { recursive: true });
    const local = new PGlite(location);
    globalDB.madaDatabase = {
      close: () => local.close(),
      query: (q, p) => local.query(q, p),
      transaction: (fn) => local.transaction((tx) => fn(tx)),
    };
  }
  return globalDB.madaDatabase;
}
