import os
import sys
import requests
import datetime as dt
from typing import Dict, Tuple
import pandas as pd
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(".env.local"))

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
SYMBOL = "NVDA"
YEAR = 2025

# Alpha Vantage endpoint and function for weekly adjusted data
AV_URL = "https://www.alphavantage.co/query"
AV_FUNCTION = "TIME_SERIES_WEEKLY_ADJUSTED"  # returns "Weekly Adjusted Time Series"

# Paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/utils
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))  # .../backend/data
OUTPUT_FILE = os.path.join(DATA_DIR, "quarterly_prices.json")


def fetch_weekly_adjusted(symbol: str, api_key: str) -> pd.DataFrame:
    """
    Fetch weekly adjusted price data from Alpha Vantage and return as a DataFrame.

    Columns: ['date', 'open', 'high', 'low', 'close', 'adjusted_close', 'volume']
    Index: DatetimeIndex on 'date' (sorted ascending)
    """
    params = {
        "function": AV_FUNCTION,
        "symbol": symbol,
        "apikey": api_key,
        "datatype": "json",
    }

    print(f"Requesting data from Alpha Vantage for {symbol}...")
    resp = requests.get(AV_URL, params=params)
    resp.raise_for_status()
    data = resp.json()

    # Handle common API error messages
    if "Error Message" in data:
        raise RuntimeError(f"Alpha Vantage error: {data['Error Message']}")
    if "Note" in data:
        # Usually rate limiting or similar
        raise RuntimeError(f"Alpha Vantage note: {data['Note']}")

    # TIME_SERIES_WEEKLY_ADJUSTED returns a key like "Weekly Adjusted Time Series"
    # See official docs: https://www.alphavantage.co/documentation/
    time_series_key = next(
        (k for k in data.keys() if "Weekly" in k and "Time Series" in k),
        None,
    )
    if not time_series_key:
        raise RuntimeError("Could not find weekly time series in Alpha Vantage response.")

    ts = data[time_series_key]

    records = []
    for date_str, values in ts.items():
        records.append(
            {
                "date": dt.datetime.strptime(date_str, "%Y-%m-%d"),
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "adjusted_close": float(values["5. adjusted close"]),
                "volume": int(float(values["6. volume"])),
            }
        )

    df = pd.DataFrame(records)
    df.sort_values("date", inplace=True)
    df.set_index("date", inplace=True)

    return df


def get_quarter_ranges(year: int) -> Dict[str, Tuple[dt.date, dt.date]]:
    """
    Return calendar-quarter ranges for the given year.
    """
    return {
        "Q1": (dt.date(year-1, 1, 27), dt.date(year-1, 4, 28)),
        "Q2": (dt.date(year-1, 4, 29), dt.date(year-1, 7, 28)),
        "Q3": (dt.date(year-1, 7, 29), dt.date(year-1, 10, 27)),
        "Q4": (dt.date(year-1, 10, 28), dt.date(year, 1, 26))
    }


def slice_quarter(df: pd.DataFrame, start: dt.date, end: dt.date) -> pd.DataFrame:
    """
    Slice the weekly DataFrame for a specific date range.
    """
    return df.loc[(df.index.date >= start) & (df.index.date <= end)]


def build_quarter_data(df: pd.DataFrame, year: int, symbol: str) -> Dict:
    """Build a structured dictionary of weekly adjusted close prices by fiscal quarter.

    The returned dict is suitable for JSON serialization and frontend plotting, e.g.:
    {
        "symbol": "NVDA",
        "fiscal_year": 2025,
        "quarters": [
            {
                "name": "Q1",
                "start": "2024-01-27",
                "end": "2024-04-28",
                "points": [
                    {"date": "2024-02-02", "adjusted_close": 123.45},
                    ...
                ],
            },
            ...
        ],
    }
    """
    quarter_ranges = get_quarter_ranges(year)

    result: Dict = {
        "symbol": symbol,
        "fiscal_year": year,
        "quarters": [],
    }

    for q_name, (start, end) in quarter_ranges.items():
        df_q = slice_quarter(df, start, end)

        quarter_entry = {
            "name": q_name,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "points": [],
        }

        if not df_q.empty:
            for ts, row in df_q.iterrows():
                quarter_entry["points"].append(
                    {
                        "date": ts.date().isoformat(),
                        "adjusted_close": float(row["adjusted_close"]),
                    }
                )
        result["quarters"].append(quarter_entry)

    return result


def main():
    if not ALPHA_VANTAGE_API_KEY:
        print("Missing ALPHA_VANTAGE_API_KEY environment variable.")
        sys.exit(1)

    try:
        df_weekly = fetch_weekly_adjusted(SYMBOL, ALPHA_VANTAGE_API_KEY)
    except Exception as e:
        print(f"Failed to fetch data: {e}")
        sys.exit(1)

    # Filter to a window that comfortably covers the fiscal year range
    fy_start = dt.date(2024, 1, 1)
    fy_end = dt.date(2025, 12, 31)
    df_for_plot = df_weekly[(df_weekly.index.date >= fy_start) &
                            (df_weekly.index.date <= fy_end)]

    # Build structured quarterly data for plotting
    data = build_quarter_data(df_for_plot, YEAR, SYMBOL)

    # Write to a JSON file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote quarterly price data to {OUTPUT_FILE}")
    

if __name__ == "__main__":
    main()