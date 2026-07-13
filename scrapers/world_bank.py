"""World Bank API — annual Vietnam macro indicators (CPI, GDP growth, FDI)."""
import requests
from base import upsert, init_db
from datetime import date

WB_BASE = "https://api.worldbank.org/v2/country/VN/indicator"

INDICATORS = {
    "FP.CPI.TOTL.ZG": ("wb_cpi_annual",    "%",    "World Bank CPI annual inflation"),
    "NY.GDP.MKTP.KD.ZG": ("wb_gdp_growth", "%",    "World Bank GDP growth annual"),
    "BX.KLT.DINV.WD.GD.ZS": ("wb_fdi_pct_gdp", "% of GDP", "World Bank FDI net inflows % GDP"),
    "SL.UEM.TOTL.ZS": ("wb_unemployment",  "%",    "World Bank unemployment % labor force"),
}

def scrape():
    results = {}
    for wb_code, (metric, unit, label) in INDICATORS.items():
        url = f"{WB_BASE}/{wb_code}?format=json&mrv=3&per_page=3"
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        records = data[1] if len(data) > 1 and data[1] else []
        for record in records:
            if record.get("value") is not None:
                year = int(record["date"])
                val  = float(record["value"])
                recorded_at = date(year, 12, 31)
                upsert(metric, val, unit, "worldbank", recorded_at)
                print(f"  {label} ({year}): {val:.2f} {unit}")
                if metric not in results:
                    results[metric] = {"year": year, "value": val}
                break
    return results

if __name__ == "__main__":
    init_db()
    results = scrape()
    print(f"\nDone: {len(results)} indicators saved")
