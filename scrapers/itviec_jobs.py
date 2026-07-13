"""Scrape total IT job count from itviec.com (no Cloudflare on main page)."""
import requests
import re
from bs4 import BeautifulSoup
from base import upsert, init_db

URL = "https://itviec.com/viec-lam-it"

def scrape() -> dict:
    resp = requests.get(URL, timeout=15, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    })
    resp.raise_for_status()

    # Pattern: "881 việc làm IT tại Việt Nam"
    match = re.search(r"([\d,]+)\s*việc làm IT", resp.text)
    if not match:
        raise ValueError("Could not find IT job count in itviec response")

    count = int(match.group(1).replace(",", ""))
    upsert("itviec_total_it_jobs", float(count), "job postings", "itviec")
    print(f"  itviec IT jobs: {count:,}")
    return {"total_it_jobs": count}

if __name__ == "__main__":
    init_db()
    result = scrape()
    print(f"\nDone: {result}")
