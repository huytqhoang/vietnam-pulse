"""Tests for usd_vnd scraper — offline parser + live API sanity."""
import pytest
import xml.etree.ElementTree as ET
from conftest import VIETCOMBANK_XML


# ---------------------------------------------------------------------------
# Offline: parser logic
# ---------------------------------------------------------------------------

def _parse_vietcombank_xml(xml_text: str) -> dict:
    """Extracted parser logic, testable without network."""
    raw = xml_text.strip()
    if raw.startswith("<!--"):
        raw = raw.split("-->", 1)[-1].strip()
    root = ET.fromstring(raw)
    for exrate in root.findall("Exrate"):
        if exrate.get("CurrencyCode") == "USD":
            return {
                "buy":  float(exrate.get("Buy",  "").replace(",", "")),
                "sell": float(exrate.get("Sell", "").replace(",", "")),
            }
    raise ValueError("USD not found")


def test_parser_extracts_usd_buy():
    result = _parse_vietcombank_xml(VIETCOMBANK_XML)
    assert result["buy"] == 26050.0


def test_parser_extracts_usd_sell():
    result = _parse_vietcombank_xml(VIETCOMBANK_XML)
    assert result["sell"] == 26460.0


def test_parser_strips_comment_header():
    xml_with_comment = "<!--comment-->\n" + VIETCOMBANK_XML.split("-->", 1)[-1]
    result = _parse_vietcombank_xml(xml_with_comment)
    assert result["sell"] > 0


def test_parser_raises_on_missing_usd():
    xml_no_usd = "<ExrateList><Exrate CurrencyCode='EUR' Buy='1' Sell='2'/></ExrateList>"
    with pytest.raises(ValueError, match="USD not found"):
        _parse_vietcombank_xml(xml_no_usd)


# ---------------------------------------------------------------------------
# Live: API reachability + sanity ranges
# ---------------------------------------------------------------------------

@pytest.mark.live
def test_live_usd_vnd_reachable():
    """Vietcombank API responds with USD entry."""
    import requests
    url = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10"
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    assert resp.status_code == 200
    assert "USD" in resp.text


@pytest.mark.live
def test_live_usd_vnd_value_in_range():
    """USD/VND sell rate is within a plausible range (20,000–35,000)."""
    import requests
    url = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10"
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    result = _parse_vietcombank_xml(resp.text)
    assert 20_000 < result["sell"] < 35_000, f"sell={result['sell']} out of expected range"
    assert result["buy"] < result["sell"], "buy should be less than sell"


@pytest.mark.live
def test_live_usd_vnd_scrape_saves_to_db(tmp_db):
    """Full scrape saves both buy and sell rows to DB."""
    import usd_vnd, base
    usd_vnd.scrape()
    sell = base.get_latest("usd_vnd_sell", 1)
    buy  = base.get_latest("usd_vnd_buy",  1)
    assert len(sell) == 1
    assert len(buy)  == 1
    assert sell[0]["value"] > 0
