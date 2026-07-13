"""Tests for vn_index scraper — live data sanity (vnstock has no useful offline mode)."""
import pytest


# ---------------------------------------------------------------------------
# Offline: data shape validation helpers
# ---------------------------------------------------------------------------

def _validate_vnindex_row(row: dict) -> None:
    """Asserts that a VN-Index record has plausible values."""
    assert "close" in row or "value" in row, "Missing close/value field"
    val = row.get("close") or row.get("value")
    assert isinstance(val, float), f"Expected float, got {type(val)}"
    assert 500 < val < 3000, f"VN-Index={val} outside plausible range 500–3000"


def test_validate_accepts_good_row():
    _validate_vnindex_row({"close": 1811.37})


def test_validate_rejects_zero():
    with pytest.raises(AssertionError):
        _validate_vnindex_row({"close": 0.0})


def test_validate_rejects_implausible_high():
    with pytest.raises(AssertionError):
        _validate_vnindex_row({"close": 99999.0})


def test_validate_rejects_implausible_low():
    with pytest.raises(AssertionError):
        _validate_vnindex_row({"close": 10.0})


# ---------------------------------------------------------------------------
# Live: vnstock library + sanity
# ---------------------------------------------------------------------------

@pytest.mark.live
@pytest.mark.timeout(60)
def test_live_vnindex_returns_data():
    """vnstock can fetch VN-Index history."""
    import sys
    from io import StringIO
    from datetime import date, timedelta
    from vnstock import Vnstock

    old_stdout = sys.stdout
    sys.stdout = StringIO()
    try:
        stock = Vnstock().stock(symbol="VNINDEX", source="VCI")
        start = (date.today() - timedelta(days=10)).isoformat()
        end = date.today().isoformat()
        hist = stock.quote.history(start=start, end=end, interval="1D")
    finally:
        sys.stdout = old_stdout

    assert hist is not None and not hist.empty, "No VN-Index data returned"
    assert "close" in hist.columns


@pytest.mark.live
@pytest.mark.timeout(60)
def test_live_vnindex_close_in_range():
    """Latest VN-Index close is within plausible range."""
    import sys
    from io import StringIO
    from datetime import date, timedelta
    from vnstock import Vnstock

    old_stdout = sys.stdout
    sys.stdout = StringIO()
    try:
        stock = Vnstock().stock(symbol="VNINDEX", source="VCI")
        start = (date.today() - timedelta(days=10)).isoformat()
        end = date.today().isoformat()
        hist = stock.quote.history(start=start, end=end, interval="1D")
    finally:
        sys.stdout = old_stdout

    latest_close = float(hist.iloc[-1]["close"])
    _validate_vnindex_row({"close": latest_close})


@pytest.mark.live
@pytest.mark.timeout(60)
def test_live_vnindex_scrape_saves_to_db(tmp_db):
    import vn_index, base
    vn_index.scrape()
    rows = base.get_latest("vn_index_close", 1)
    assert len(rows) == 1
    _validate_vnindex_row({"close": rows[0]["value"]})
