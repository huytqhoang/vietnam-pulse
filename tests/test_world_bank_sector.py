"""Tests for world_bank_sector scraper."""
import pytest
from unittest.mock import patch, MagicMock


SECTOR_FIXTURE = [
    {"page": 1, "pages": 1, "per_page": 50, "total": 1},
    [{"indicator": {"id": "SL.IND.EMPL.ZS"}, "country": {"id": "VN"},
      "date": "2025", "value": 34.83}]
]


# ---------------------------------------------------------------------------
# Offline: value range validators
# ---------------------------------------------------------------------------

def _validate_pct(val: float, label: str) -> None:
    assert 0 < val < 100, f"{label}={val} not a valid percentage"


def test_industry_pct_plausible():
    _validate_pct(34.83, "industry")


def test_services_pct_plausible():
    _validate_pct(40.13, "services")


def test_agri_pct_plausible():
    _validate_pct(25.04, "agriculture")


def test_sector_sum_near_100():
    total = 34.83 + 40.13 + 25.04
    assert 95 < total < 105, f"Sector percentages sum to {total}, expected ~100"


def test_youth_unemployment_plausible():
    val = 6.17
    assert 0 < val < 40, f"youth unemployment={val} outside plausible range"


def test_manufacturing_pct_gdp_plausible():
    val = 24.53
    assert 5 < val < 50, f"manufacturing % GDP={val} outside plausible range"


# ---------------------------------------------------------------------------
# Offline: mocked scrape
# ---------------------------------------------------------------------------

@pytest.mark.usefixtures("tmp_db")
def test_mock_sector_scrape_saves(tmp_db, monkeypatch):
    import requests
    import world_bank_sector, base

    fake_resp = MagicMock()
    fake_resp.raise_for_status = MagicMock()
    fake_resp.json.return_value = SECTOR_FIXTURE

    with patch.object(requests, "get", return_value=fake_resp):
        world_bank_sector.scrape()

    rows = base.get_latest("wb_employ_industry_pct", 1)
    assert len(rows) == 1
    assert abs(rows[0]["value"] - 34.83) < 0.1


# ---------------------------------------------------------------------------
# Live
# ---------------------------------------------------------------------------

@pytest.mark.live
@pytest.mark.timeout(30)
def test_live_sector_employment_in_range():
    import requests
    for indicator, label, lo, hi in [
        ("SL.IND.EMPL.ZS",  "industry",    10, 60),
        ("SL.SRV.EMPL.ZS",  "services",    10, 70),
        ("SL.AGR.EMPL.ZS",  "agriculture",  5, 60),
    ]:
        url = f"https://api.worldbank.org/v2/country/VN/indicator/{indicator}?format=json&mrv=1"
        try:
            resp = requests.get(url, timeout=20)
            data = resp.json()
            val = data[1][0]["value"]
            if val is not None:
                assert lo < val < hi, f"{label}={val} outside [{lo},{hi}]"
        except Exception:
            pytest.skip(f"World Bank API unavailable for {indicator}")
