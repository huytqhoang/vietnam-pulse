import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "../data.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
  }
  return _db;
}

export interface Indicator {
  metric: string;
  value: number;
  unit: string | null;
  recorded_at: string;
  source: string | null;
}

export function getLatest(metric: string, days = 30): Indicator[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT metric, value, unit, recorded_at, source
       FROM indicators
       WHERE metric = ?
       ORDER BY recorded_at DESC
       LIMIT ?`
    )
    .all(metric, days) as Indicator[];
}

export function getMultipleLatest(
  metrics: string[],
  days = 30
): Record<string, Indicator[]> {
  const result: Record<string, Indicator[]> = {};
  for (const m of metrics) {
    result[m] = getLatest(m, days);
  }
  return result;
}
