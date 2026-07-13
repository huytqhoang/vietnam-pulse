"""SJC gold price from DOJI (giavang.doji.vn) — no Cloudflare protection."""
import requests
import re
from bs4 import BeautifulSoup
from base import upsert, init_db

URL = "https://giavang.doji.vn/"

def scrape():
    resp = requests.get(URL, timeout=15, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    })
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    # The page has a ticker text: 'SJC (nghìn/lượng): 145,400/148,400'
    # Also in a structured table with nghìn/chỉ values
    ticker_match = re.search(r"SJC \(nghìn/lượng\):\s*([\d,]+)/([\d,]+)", resp.text)
    if ticker_match:
        buy_nghin  = float(ticker_match.group(1).replace(",", ""))
        sell_nghin = float(ticker_match.group(2).replace(",", ""))
        # Convert from nghìn/lượng to VND/lượng
        buy_vnd  = buy_nghin  * 1000
        sell_vnd = sell_nghin * 1000
        upsert("gold_sjc_buy_vnd",  buy_vnd,  "VND/lượng", "doji")
        upsert("gold_sjc_sell_vnd", sell_vnd, "VND/lượng", "doji")
        print(f"  SJC gold: buy={buy_vnd/1_000_000:.1f}M  sell={sell_vnd/1_000_000:.1f}M VND/lượng")
        return {"buy_vnd": buy_vnd, "sell_vnd": sell_vnd}

    # Fallback: parse table rows
    for row in soup.select("table.goldprice-view tr"):
        cells = row.find_all("td")
        if cells and "SJC" in cells[0].get_text() and "Bán Lẻ" in cells[0].get_text():
            divs = row.select("div.item-relative")
            if len(divs) >= 2:
                buy_nghin_chi  = float(divs[0].text.replace(",", ""))
                sell_nghin_chi = float(divs[1].text.replace(",", ""))
                # nghìn/chỉ → VND/lượng (1 lượng = 10 chỉ)
                buy_vnd  = buy_nghin_chi  * 1000 * 10
                sell_vnd = sell_nghin_chi * 1000 * 10
                upsert("gold_sjc_buy_vnd",  buy_vnd,  "VND/lượng", "doji")
                upsert("gold_sjc_sell_vnd", sell_vnd, "VND/lượng", "doji")
                print(f"  SJC gold (table): buy={buy_vnd/1_000_000:.1f}M  sell={sell_vnd/1_000_000:.1f}M VND/lượng")
                return {"buy_vnd": buy_vnd, "sell_vnd": sell_vnd}

    raise ValueError("Could not parse SJC gold price from DOJI")

if __name__ == "__main__":
    init_db()
    result = scrape()
    print(f"\nDone: {result}")
