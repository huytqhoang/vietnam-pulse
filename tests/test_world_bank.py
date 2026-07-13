"""Tests for world_bank scraper — offline mock + live API sanity."""
import json
import pytest
from datetime import date
from unittest.mock import patch, MagicMock
from conftest import WORLDBANK_CPI_RESPONSE


# ---------------------------------------------------------------------------
# Offline: mocked HTTP responses
# ---------------------------------------------------------------------------

INDICATORS_UNDER_TEST = {
    "FP.CPI.TOTL.ZG":    ("wb_cpi_annual",   "%"),
    "NY.GDP.MKTP.KD.ZG": ("wb_gdp_growth",   "%"),
}


def _make_wb_response(year: str, value: float) -> list:
    return [
        {"page": 1, "pages": 1, "per_page": 50, "total": 1},
        [{"indicator": {"id": "TEST"}, "country": {"id": "VN"}, "date": year, "value": value}]
    ]


def test_wb_cpi_response_parsed():
    """Verify our fixture has the expected structure."""
    records = WORLDBANK_CPI_RESPONSE[1]
    assert len(records) == 1
    assert records[0]["value"] == 3.31
    assert records[0]["date"] == "2025"


@pytest.mark.usefixtures("tmp_db")
def test_mock_scrape_saves_cpi(tmp_db, monkeypatch):
    import requests
    import world_bank, base

    fake_resp = MagicMock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = WORLDBANK_CPI_RESPONSE
    fake_resp.raise_for_status = MagicMock()

    with patch.object(requests, "get", return_value=fake_resp):
        world_bank.scrape()

    rows = base.get_latest("wb_cpi_annual", 1)
    assert len(rows) == 1
    assert abs(rows[0]["value"] - 3.31) < 0.01


def test_wb_handles_null_value(tmp_db, monkeypatch):
    """Records with null value should be skipped without crashing."""
    import requests
    import world_bank, base

    null_response = [
        {"page": 1, "pages": 1, "per_page": 50, "total": 1},
        [{"indicator": {"id": "FP.CPI.TOTL.ZG"}, "country": {"id": "VN"},
          "date": "2025", "value": None}]
    ]
    fake_resp = MagicMock()
    fake_resp.json.return_value = null_response
    fake_resp.raise_for_status = MagicMock()

    with patch.object(requests, "get", return_value=fake_resp):
        result = world_bank.scrape()

    rows = base.get_latest("wb_cpi_annual", 1)
    assert len(rows) == 0  # null value skipped


# ---------------------------------------------------------------------------
# Live: API reachability + sanity ranges
# ---------------------------------------------------------------------------

def _wb_get(url: str) -> list:
    """Fetch World Bank JSON, skipping on any network/parse transient error."""
    import requests
    try:
        resp = requests.get(url, timeout=25)
        resp.raise_for_status()
        return resp.json()
    except (requests.exceptions.Timeout,
            requests.exceptions.ConnectionError,
            requests.exceptions.JSONDecodeError,
            ValueError) as exc:
        pytest.skip(f"World Bank API unavailable (transient): {exc}")


@pytest.mark.live
@pytest.mark.timeout(30)
def test_live_worldbank_reachable():
    url = "https://api.worldbank.org/v2/country/VN/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1"
    data = _wb_get(url)
    assert len(data) == 2 and data[1] is not None


@pytest.mark.live
@pytest.mark.timeout(30)
def test_live_cpi_in_range():
    """Vietnam CPI inflation should be between -5% and 20%."""
    url = "https://api.worldbank.org/v2/country/VN/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2"
    data = _wb_get(url)
    values = [r["value"] for r in data[1] if r.get("value") is not None]
    assert values, "No non-null CPI values returned"
    for v in values:
        assert -5 < v < 20, f"CPI={v} outside plausible range"


@pytest.mark.live
@pytest.mark.timeout(30)
def test_live_gdp_growth_in_range():
    """Vietnam GDP growth should be between -5% and 15%."""
    url = "https://api.worldbank.org/v2/country/VN/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=2"
    data = _wb_get(url)
    values = [r["value"] for r in data[1] if r.get("value") is not None]
    assert values
    for v in values:
        assert -5 < v < 15, f"GDP growth={v} outside plausible range"
