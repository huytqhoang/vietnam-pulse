"""Tests for gold_price scraper — offline parser + live API sanity."""
import re
import pytest
from bs4 import BeautifulSoup
from conftest import DOJI_HTML_TICKER, DOJI_HTML_TABLE


# ---------------------------------------------------------------------------
# Offline: parser logic (mirroring gold_price.py)
# ---------------------------------------------------------------------------

def _parse_ticker(html: str) -> dict | None:
    m = re.search(r"SJC \(nghìn/lượng\):\s*([\d,]+)/([\d,]+)", html)
    if not m:
        return None
    buy_vnd  = float(m.group(1).replace(",", "")) * 1000
    sell_vnd = float(m.group(2).replace(",", "")) * 1000
    return {"buy_vnd": buy_vnd, "sell_vnd": sell_vnd}


def _parse_table(html: str) -> dict | None:
    soup = BeautifulSoup(html, "lxml")
    for row in soup.select("table.goldprice-view tr"):
        cells = row.find_all("td")
        if cells and "SJC" in cells[0].get_text() and "Bán Lẻ" in cells[0].get_text():
            divs = row.select("div.item-relative")
            if len(divs) >= 2:
                buy_vnd  = float(divs[0].text.replace(",", "")) * 1000 * 10
                sell_vnd = float(divs[1].text.replace(",", "")) * 1000 * 10
                return {"buy_vnd": buy_vnd, "sell_vnd": sell_vnd}
    return None


def test_ticker_parser_buy():
    result = _parse_ticker(DOJI_HTML_TICKER)
    assert result is not None
    assert result["buy_vnd"] == 145_400_000


def test_ticker_parser_sell():
    result = _parse_ticker(DOJI_HTML_TICKER)
    assert result["sell_vnd"] == 148_400_000


def test_ticker_parser_returns_none_on_no_match():
    assert _parse_ticker("no gold price here") is None


def test_table_parser_buy():
    result = _parse_table(DOJI_HTML_TABLE)
    assert result is not None
    assert result["buy_vnd"] == 145_400_000   # 14,540 nghìn/chỉ × 1000 × 10


def test_table_parser_sell():
    result = _parse_table(DOJI_HTML_TABLE)
    assert result["sell_vnd"] == 148_400_000


def test_table_parser_returns_none_on_empty_table():
    assert _parse_table("<html><body></body></html>") is None


def test_sell_greater_than_buy_ticker():
    result = _parse_ticker(DOJI_HTML_TICKER)
    assert result["sell_vnd"] > result["buy_vnd"]


def test_sell_greater_than_buy_table():
    result = _parse_table(DOJI_HTML_TABLE)
    assert result["sell_vnd"] > result["buy_vnd"]


# ---------------------------------------------------------------------------
# Live: API reachability + sanity ranges
# ---------------------------------------------------------------------------

@pytest.mark.live
def test_live_doji_reachable():
    import requests
    resp = requests.get("https://giavang.doji.vn/", timeout=15,
                        headers={"User-Agent": "Mozilla/5.0"})
    assert resp.status_code == 200


@pytest.mark.live
def test_live_gold_value_in_range():
    """SJC sell price should be between 50M and 250M VND/lượng."""
    import requests
    resp = requests.get("https://giavang.doji.vn/", timeout=15,
                        headers={"User-Agent": "Mozilla/5.0"})
    result = _parse_ticker(resp.text)
    assert result is not None, "Ticker parser failed on live page"
    assert 50_000_000 < result["sell_vnd"] < 250_000_000, \
        f"sell_vnd={result['sell_vnd']} out of range"


@pytest.mark.live
def test_live_gold_scrape_saves_to_db(tmp_db):
    import gold_price, base
    gold_price.scrape()
    rows = base.get_latest("gold_sjc_sell_vnd", 1)
    assert len(rows) == 1
    assert rows[0]["value"] > 0
