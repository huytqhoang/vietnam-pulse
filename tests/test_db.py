"""Unit tests for base.py — SQLite operations."""
import pytest
from datetime import date


def test_init_creates_table(tmp_db):
    import sqlite3
    conn = sqlite3.connect(tmp_db)
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    assert any("indicators" in str(t) for t in tables)
    conn.close()


def test_upsert_inserts_row(tmp_db):
    import base
    base.upsert("test_metric", 42.0, "units", "test_source", date(2026, 7, 13))
    rows = base.get_latest("test_metric", 1)
    assert len(rows) == 1
    assert rows[0]["value"] == 42.0
    assert rows[0]["recorded_at"] == "2026-07-13"


def test_upsert_is_idempotent(tmp_db):
    """Upserting same metric+date twice keeps only one row with latest value."""
    import base
    d = date(2026, 7, 13)
    base.upsert("dup_metric", 100.0, "units", "src", d)
    base.upsert("dup_metric", 200.0, "units", "src", d)
    rows = base.get_latest("dup_metric", 10)
    assert len(rows) == 1
    assert rows[0]["value"] == 200.0


def test_get_latest_returns_newest_first(tmp_db):
    import base
    for i in range(5):
        base.upsert("series_metric", float(i), "u", "s", date(2026, 7, i + 1))
    rows = base.get_latest("series_metric", 10)
    dates = [r["recorded_at"] for r in rows]
    assert dates == sorted(dates, reverse=True)


def test_get_latest_respects_limit(tmp_db):
    import base
    for i in range(10):
        base.upsert("limit_metric", float(i), "u", "s", date(2026, 7, i + 1))
    rows = base.get_latest("limit_metric", 3)
    assert len(rows) == 3


def test_get_latest_empty_metric(tmp_db):
    import base
    rows = base.get_latest("nonexistent_metric", 5)
    assert rows == []


def test_upsert_uses_today_by_default(tmp_db, monkeypatch):
    import base
    from datetime import date as _date
    fixed = _date(2026, 7, 13)
    monkeypatch.setattr(base, "date", type("FakeDate", (), {"today": staticmethod(lambda: fixed)})())
    base.upsert("today_metric", 1.0, "u", "s")
    rows = base.get_latest("today_metric", 1)
    assert rows[0]["recorded_at"] == "2026-07-13"
