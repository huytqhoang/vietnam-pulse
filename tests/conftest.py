"""Shared fixtures for vietnam-pulse test suite."""
import os
import sys
import sqlite3
import tempfile
import pytest

# Ensure scrapers/ is importable from tests/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scrapers"))


@pytest.fixture
def tmp_db(tmp_path, monkeypatch):
    """Isolated SQLite DB for each test — patches DB_PATH in base module."""
    db_file = tmp_path / "test.db"
    import base
    monkeypatch.setattr(base, "DB_PATH", db_file)
    base.init_db()
    yield db_file


# ---------------------------------------------------------------------------
# Fixture HTML/XML blobs (offline, no network needed)
# ---------------------------------------------------------------------------

VIETCOMBANK_XML = """\
<!--For reference only. Only one request every 5 minutes!-->
<ExrateList>
  <DateTime>7/13/2026 10:00:00 AM</DateTime>
  <Exrate CurrencyCode="USD" CurrencyName="US DOLLAR" Buy="26,050.00" Transfer="26,080.00" Sell="26,460.00" />
  <Exrate CurrencyCode="EUR" CurrencyName="EURO" Buy="29,168.56" Transfer="29,463.20" Sell="30,706.39" />
  <Source>Vietcombank</Source>
</ExrateList>"""

DOJI_HTML_TICKER = "SJC (nghìn/lượng): 145,400/148,400"

DOJI_HTML_TABLE = """\
<html><body>
<table class="goldprice-view">
  <thead><tr><th>Giá vàng trong nước</th><th>Mua</th><th>Bán</th></tr></thead>
  <tr class="odd">
    <td class="first">
      <span class="title">SJC -Bán Lẻ</span>
      <span class="sub-title">(nghìn/chỉ)</span>
    </td>
    <td class="goldprice-td"><div class="item-relative">14,540</div></td>
    <td class="goldprice-td"><div class="item-relative">14,840</div></td>
  </tr>
</table>
</body></html>"""

WORLDBANK_CPI_RESPONSE = [
    {"page": 1, "pages": 1, "per_page": 50, "total": 1},
    [
        {
            "indicator": {"id": "FP.CPI.TOTL.ZG", "value": "Inflation, consumer prices (annual %)"},
            "country": {"id": "VN", "value": "Viet Nam"},
            "date": "2025",
            "value": 3.31
        }
    ]
]
