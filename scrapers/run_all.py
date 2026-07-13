"""POC: Run all scrapers and print a dashboard summary."""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from base import init_db, get_latest

def run():
    init_db()

    print("\n=== SCRAPING: USD/VND ===")
    try:
        import usd_vnd
        usd_vnd.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== SCRAPING: SJC Gold ===")
    try:
        import gold_price
        gold_price.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== SCRAPING: VN-Index ===")
    try:
        import vn_index
        vn_index.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== SCRAPING: World Bank macro ===")
    try:
        import world_bank
        world_bank.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== SCRAPING: World Bank sector employment ===")
    try:
        import world_bank_sector
        world_bank_sector.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n=== SCRAPING: itviec IT jobs ===")
    try:
        import itviec_jobs
        itviec_jobs.scrape()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n" + "="*50)
    print("SUMMARY — latest values in DB")
    print("="*50)

    metrics = {
        "usd_vnd_sell":     ("USD/VND (sell)",          "VND"),
        "gold_sjc_sell_vnd":("SJC Gold (sell)",         "VND/lượng"),
        "vn_index_close":   ("VN-Index",                "points"),
        "wb_cpi_annual":    ("CPI Inflation (annual)",  "%"),
        "wb_gdp_growth":    ("GDP Growth (annual)",     "%"),
    }

    print()
    for metric, (label, unit) in metrics.items():
        rows = get_latest(metric, 1)
        if rows:
            r = rows[0]
            val = r["value"]
            if unit == "VND":
                display = f"{val:>12,.0f} {unit}"
            elif unit == "VND/lượng":
                display = f"{val/1_000_000:>10.1f}M {unit}"
            else:
                display = f"{val:>10.2f} {unit}"
            print(f"  {label:<28} {display}  [{r['recorded_at']}]")
        else:
            print(f"  {label:<28} no data")

    print()

if __name__ == "__main__":
    run()
