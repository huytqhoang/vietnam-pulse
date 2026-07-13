"""Tests for itviec_jobs scraper."""
import re
import pytest
from unittest.mock import patch, MagicMock


def _parse_it_job_count(html: str) -> int | None:
    m = re.search(r"([\d,]+)\s*việc làm IT", html)
    if not m:
        return None
    return int(m.group(1).replace(",", ""))


# ---------------------------------------------------------------------------
# Offline: parser
# ---------------------------------------------------------------------------

def test_parser_extracts_count():
    html = "<html><body>881 việc làm IT tại Việt Nam</body></html>"
    assert _parse_it_job_count(html) == 881


def test_parser_handles_comma_thousands():
    html = "1,234 việc làm IT tại Việt Nam"
    assert _parse_it_job_count(html) == 1234


def test_parser_returns_none_on_no_match():
    assert _parse_it_job_count("<html>no jobs here</html>") is None


def test_parsed_count_is_positive():
    html = "500 việc làm IT"
    count = _parse_it_job_count(html)
    assert count is not None and count > 0


# ---------------------------------------------------------------------------
# Live
# ---------------------------------------------------------------------------

@pytest.mark.live
@pytest.mark.timeout(20)
def test_live_itviec_reachable():
    import requests
    resp = requests.get(
        "https://itviec.com/viec-lam-it",
        timeout=15,
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120"},
    )
    assert resp.status_code == 200


@pytest.mark.live
@pytest.mark.timeout(20)
def test_live_itviec_count_in_range():
    import requests
    resp = requests.get(
        "https://itviec.com/viec-lam-it",
        timeout=15,
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120"},
    )
    count = _parse_it_job_count(resp.text)
    assert count is not None, "IT job count not found in itviec response"
    assert 100 < count < 50_000, f"count={count} outside plausible range 100–50,000"


@pytest.mark.live
@pytest.mark.timeout(20)
def test_live_itviec_scrape_saves_to_db(tmp_db):
    import itviec_jobs, base
    itviec_jobs.scrape()
    rows = base.get_latest("itviec_total_it_jobs", 1)
    assert len(rows) == 1
    assert rows[0]["value"] > 0
