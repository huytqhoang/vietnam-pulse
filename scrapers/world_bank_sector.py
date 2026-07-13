"""World Bank Vietnam sector employment & manufacturing indicators."""
import requests
from base import upsert, init_db
from datetime import date

WB_BASE = "https://api.worldbank.org/v2/country/VN/indicator"

INDICATORS = {
    "SL.IND.EMPL.ZS":   ("wb_employ_industry_pct",   "% of total",  "Industry employment % of total employment"),
    "SL.SRV.EMPL.ZS":   ("wb_employ_services_pct",   "% of total",  "Services employment % of total employment"),
    "SL.AGR.EMPL.ZS":   ("wb_employ_agri_pct",       "% of total",  "Agriculture employment % of total employment"),
    "SL.UEM.1524.ZS":   ("wb_youth_unemployment",    "%",           "Youth unemployment % (15-24)"),
    "NV.IND.MANF.ZS":   ("wb_manufacturing_pct_gdp", "% of GDP",    "Manufacturing value added % of GDP"),
    "NV.IND.TOTL.ZS":   ("wb_industry_pct_gdp",      "% of GDP",    "Industry value added % of GDP"),
    "SL.TLF.TOTL.IN":   ("wb_labor_force_total",     "persons",     "Total labor force"),
}

def _wb_get(indicator: str) -> list:
    url = f"{WB_BASE}/{indicator}?format=json&mrv=4&per_page=4"
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data[1] if len(data) > 1 and data[1] else []
    except Exception as e:
        print(f"  WARNING: {indicator} fetch failed: {e}")
        return []

def scrape() -> dict:
    results = {}
    for wb_code, (metric, unit, label) in INDICATORS.items():
        records = _wb_get(wb_code)
        saved = False
        for record in records:
            if record.get("value") is not None:
                year = int(record["date"])
                val  = float(record["value"])
                recorded_at = date(year, 12, 31)
                upsert(metric, val, unit, "worldbank", recorded_at)
                if not saved:
                    print(f"  {label} ({year}): {val:.2f} {unit}")
                    results[metric] = {"year": year, "value": val}
                    saved = True
        if not saved:
            print(f"  {label}: no data")
    return results

if __name__ == "__main__":
    init_db()
    results = scrape()
    print(f"\nDone: {len(results)} sector indicators saved")
