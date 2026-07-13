"""USD/VND exchange rate from Vietcombank XML API."""
import requests
import xml.etree.ElementTree as ET
from base import upsert, init_db

URL = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10"

def scrape():
    resp = requests.get(URL, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    root = ET.fromstring(resp.text.strip().lstrip("<!--").split("-->")[-1].strip())
    for exrate in root.findall("Exrate"):
        if exrate.get("CurrencyCode") == "USD":
            sell_str = exrate.get("Sell", "").replace(",", "")
            buy_str  = exrate.get("Buy",  "").replace(",", "")
            sell = float(sell_str)
            buy  = float(buy_str)
            upsert("usd_vnd_sell", sell, "VND", "vietcombank")
            upsert("usd_vnd_buy",  buy,  "VND", "vietcombank")
            print(f"  USD/VND: buy={buy:,.0f}  sell={sell:,.0f}")
            return {"buy": buy, "sell": sell}
    raise ValueError("USD not found in Vietcombank response")

if __name__ == "__main__":
    init_db()
    result = scrape()
    print(f"\nDone: USD/VND = {result}")
