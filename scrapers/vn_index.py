"""VN-Index daily close via vnstock library (VCI data source)."""
import os
import sys
import warnings

# Suppress vnstock ads/banners
os.environ["VNSTOCK_DISABLE_BANNER"] = "1"
warnings.filterwarnings("ignore")

from datetime import date, timedelta
from base import upsert, init_db

def scrape():
    # Suppress stdout during import to hide promo banners
    from io import StringIO
    old_stdout = sys.stdout
    sys.stdout = StringIO()
    try:
        from vnstock import Vnstock
        stock = Vnstock().stock(symbol="VNINDEX", source="VCI")
        start = (date.today() - timedelta(days=7)).isoformat()
        end = date.today().isoformat()
        hist = stock.quote.history(start=start, end=end, interval="1D")
    finally:
        sys.stdout = old_stdout

    if hist is None or hist.empty:
        raise ValueError("No VN-Index data returned")

    latest = hist.iloc[-1]
    close_val = float(latest["close"])
    record_date = str(latest["time"])[:10]

    from datetime import datetime
    recorded_at = datetime.strptime(record_date, "%Y-%m-%d").date()

    upsert("vn_index_close", close_val, "points", "vnstock_vci", recorded_at)
    print(f"  VN-Index: {close_val:.2f} pts ({record_date})")
    return {"close": close_val, "date": record_date}

if __name__ == "__main__":
    init_db()
    result = scrape()
    print(f"\nDone: {result}")
