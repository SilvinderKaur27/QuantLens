import time
import pandas as pd
import yfinance as yf

_cache = {}

def get_stock_data(ticker: str, period: str = "6mo") -> pd.DataFrame:
    ticker = ticker.strip().upper()
    if not ticker:
        raise ValueError("Ticker is required.")
    df = yf.Ticker(ticker).history(
        period = period,
        interval = "1d",
        auto_adjust = True
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

def get_stock_data_cached(ticker: str, max_age_seconds: int = 300) -> pd.DataFrame:
    ticker = ticker.strip().upper()
    now = time.time()

    cached = _cache.get(ticker)
    if cached and now - cached[0] < max_age_seconds:
        return cached[1].copy()

    df = get_stock_data(ticker)
    _cache[ticker] = (now, df)
    # return df
    return df.copy()