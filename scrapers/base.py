import sqlite3
import json
from datetime import date
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS indicators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT,
            recorded_at TEXT NOT NULL,
            source TEXT,
            UNIQUE(metric, recorded_at)
        )
    """)
    conn.commit()
    conn.close()

def upsert(metric: str, value: float, unit: str, source: str, recorded_at: date = None):
    if recorded_at is None:
        recorded_at = date.today()
    conn = get_db()
    conn.execute("""
        INSERT INTO indicators (metric, value, unit, recorded_at, source)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(metric, recorded_at) DO UPDATE SET
            value = excluded.value,
            source = excluded.source
    """, (metric, value, unit, str(recorded_at), source))
    conn.commit()
    conn.close()
    print(f"  saved: {metric} = {value} {unit} ({recorded_at})")

def get_latest(metric: str, days: int = 30) -> list:
    conn = get_db()
    rows = conn.execute("""
        SELECT recorded_at, value, unit FROM indicators
        WHERE metric = ?
        ORDER BY recorded_at DESC
        LIMIT ?
    """, (metric, days)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
