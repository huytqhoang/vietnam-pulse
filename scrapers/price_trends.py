"""
Price category scraper — two signals:
1. Google Trends search interest per price category (weekly, rate-limited)
2. Petrolimex fuel price from latest announcement article
"""
import requests
import re
import time
from datetime import date, timedelta
from bs4 import BeautifulSoup
from base import upsert, init_db

# ---------------------------------------------------------------------------
# Google Trends — search interest as "price anxiety" proxy
# ---------------------------------------------------------------------------

TREND_KEYWORDS = {
    "giá xăng":     "trend_fuel_interest",
    "giá điện":     "trend_electricity_interest",
    "giá gạo":      "trend_rice_interest",
    "giá thịt heo": "trend_pork_interest",
    "giá vàng":     "trend_gold_interest",
}

def scrape_trends() -> dict:
    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("  pytrends not installed — skipping")
        return {}

    results = {}
    pytrends = TrendReq(hl="vi", tz=420, timeout=(15, 45))

    for keyword, metric in TREND_KEYWORDS.items():
        try:
            pytrends.build_payload([keyword], timeframe="today 3-m", geo="VN")
            df = pytrends.interest_over_time()
            if not df.empty and keyword in df.columns:
                today_val = float(df[keyword].iloc[-1])
                avg_val   = float(df[keyword].mean())
                # Store today's interest score (0-100)
                upsert(metric, today_val, "score/100", "google_trends")
                # Store the 12-week weekly series as individual dated rows
                recent = df[keyword].tail(12)
                for dt, val in recent.items():
                    row_date = dt.date() if hasattr(dt, "date") else date.today()
                    upsert(metric, float(val), "score/100", "google_trends", row_date)
                results[keyword] = {"latest": today_val, "avg": round(avg_val, 1)}
                print(f"  {keyword}: latest={today_val:.0f} avg={avg_val:.1f}")
            time.sleep(6)  # respect rate limits
        except Exception as e:
            print(f"  {keyword}: {e}")
            time.sleep(10)

    return results

# ---------------------------------------------------------------------------
# Petrolimex — fuel price from announcement article
# ---------------------------------------------------------------------------

PLX_HOME = "https://giaxang.petrolimex.com.vn/"

def _get_latest_announcement_url() -> tuple[str, str]:
    """Return (url, date_str) of the most recent price announcement."""
    resp = requests.get(PLX_HOME, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")
    for a in soup.find_all("a", href=True):
        txt = a.get_text(strip=True)
        if "điều chỉnh giá xăng dầu" in txt.lower():
            href = a["href"]
            if not href.startswith("http"):
                href = PLX_HOME.rstrip("/") + "/" + href.lstrip("/")
            # Extract date from text like "09.7.2026"
            date_match = re.search(r"(\d{1,2})[./](\d{1,2})[./](202\d)", txt)
            date_str = date_match.group(0) if date_match else "unknown"
            return href, date_str
    return "", "unknown"

def _parse_fuel_price_from_article(html: str) -> dict[str, float]:
    """
    Try to extract price numbers from article text.
    Vietnamese fuel types: RON95-III, E5RON92, dầu DO 0.05S, dầu mazut.
    Price format: "21.340 đồng/lít" (Vietnamese thousands separator is '.')
    """
    # Remove all tags and look for price patterns near fuel keywords
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(separator=" ")

    prices = {}

    # Pattern: fuel name followed by price like "21.340" or "21,340"
    patterns = [
        (r"RON95[- ]III[^0-9]{0,30}(\d{2}[.,]\d{3})", "a95_ron95"),
        (r"E5\s*RON\s*92[^0-9]{0,30}(\d{2}[.,]\d{3})", "e5_ron92"),
        (r"d[aầ]u\s*[Dd][Oo][^0-9]{0,30}(\d{2}[.,]\d{3})", "diesel"),
        (r"xăng\s*RON[^0-9]{0,30}(\d{2}[.,]\d{3})", "petrol_ron"),
    ]

    for pattern, key in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            raw = m.group(1).replace(",", "").replace(".", "")
            prices[key] = float(raw)

    # Fallback: any number in 18000-30000 range preceded by fuel keyword
    if not prices:
        all_nums = re.findall(r"(\d{2}[.,]\d{3})(?!\d)", text)
        fuel_prices = []
        for n in all_nums:
            val = float(n.replace(",", "").replace(".", ""))
            if 18000 <= val <= 30000:
                fuel_prices.append(val)
        if fuel_prices:
            prices["petrol_estimate"] = max(set(fuel_prices), key=fuel_prices.count)

    return prices

def scrape_fuel_price() -> dict:
    url, announce_date = _get_latest_announcement_url()
    if not url:
        print("  Could not find Petrolimex announcement URL")
        return {}

    print(f"  Latest announcement: {announce_date} → {url}")

    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120"})
    resp.raise_for_status()
    prices = _parse_fuel_price_from_article(resp.text)

    if prices:
        for fuel_type, val in prices.items():
            metric = f"fuel_{fuel_type}_vnd"
            upsert(metric, val, "VND/liter", "petrolimex")
            print(f"  {fuel_type}: {val:,.0f} VND/liter")
    else:
        print("  Prices in images — recording announcement date only")
        # Store 1 as a flag that we know the price changed on this date
        upsert("fuel_last_adjustment_flag", 1.0, "event", "petrolimex")

    # Always store the announcement date as a separate metric (as days since epoch)
    date_match = re.search(r"(\d{1,2})[./](\d{1,2})[./](202\d)", announce_date)
    if date_match:
        d, m, y = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
        try:
            adj_date = date(y, m, d)
            upsert("fuel_last_adjustment_day", float((adj_date - date(2024, 1, 1)).days),
                   "days since 2024-01-01", "petrolimex")
        except ValueError:
            pass

    return prices


if __name__ == "__main__":
    init_db()
    print("\n=== Fuel price ===")
    fuel = scrape_fuel_price()

    print("\n=== Price trends (Google) ===")
    trends = scrape_trends()

    print(f"\nDone: fuel={fuel}, trends={len(trends)} keywords")
