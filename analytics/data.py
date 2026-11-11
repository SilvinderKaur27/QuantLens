import time
from pathlib import Path

import pandas as pd
import yfinance as yf

_cache = {}


def get_stock_data(ticker: str, period: str = "6mo") -> pd.DataFrame:
    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker is required.")

    df = yf.Ticker(ticker).history(
        period=period,
        interval="1d",
        auto_adjust=True
    )

    if df.empty:
        raise ValueError(f"No price data found for '{ticker}'.")

    required_columns = ["Open", "High", "Low", "Close", "Volume"]
    missing = [col for col in required_columns if col not in df.columns]

    if missing:
        raise ValueError(f"Missing price columns: {missing}")

    df = df[required_columns].copy()

    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    df = df.dropna(subset=["Open", "High", "Low", "Close"])

    if df.empty:
        raise ValueError(f"No usable price data found for {ticker}.")

    return df


def get_historical_stock_data(
    ticker: str,
    start_date: str,
    end_date: str,
    save_csv: bool = True
) -> pd.DataFrame:

    ticker = ticker.strip().upper()

    if not ticker:
        raise ValueError("Ticker is required.")

    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)

    if start >= end:
        raise ValueError("Start date must be earlier than end date.")

    df = yf.Ticker(ticker).history(
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        interval="1d",
        auto_adjust=True
    )

    if df.empty:
        raise ValueError(f"No historical data found for '{ticker}'.")

    required_columns = ["Open", "High", "Low", "Close", "Volume"]
    missing = [col for col in required_columns if col not in df.columns]

    if missing:
        raise ValueError(f"Missing price columns: {missing}")

    df = df[required_columns].copy()

    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    df.index.name = "Date"
    df = df.sort_index()

    if df.index.has_duplicates:
        raise ValueError("Duplicate dates found.")

    df = df.dropna(subset=["Open", "High", "Low", "Close"])

    if df.empty:
        raise ValueError(f"No usable price data found for {ticker}.")

    if save_csv:
        output_dir = Path(__file__).parent / "data" / "historical"
        output_dir.mkdir(parents=True, exist_ok=True)

        filename = (
            f"{ticker.replace('.', '_')}_"
            f"{start:%Y%m%d}_{end:%Y%m%d}.csv"
        )

        output_path = output_dir / filename
        df.to_csv(output_path)

        print(f"Saved historical data to: {output_path}")

    return df


def get_stock_data_cached(
    ticker: str,
    max_age_seconds: int = 300
) -> pd.DataFrame:

    ticker = ticker.strip().upper()
    now = time.time()

    cached = _cache.get(ticker)

    if cached and now - cached[0] < max_age_seconds:
        return cached[1].copy()

    df = get_stock_data(ticker)
    _cache[ticker] = (now, df)

    return df.copy()