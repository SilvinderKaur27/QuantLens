import numpy as np
import pandas as pd
import pandas_ta as ta
from data import get_stock_data_cached

def calculate_trend(ticker: str) -> dict:
    ticker = ticker.strip().upper()
    df = get_stock_data_cached(ticker).copy()
    if len(df) < 50:
        raise ValueError("Atleast 50 daily prices are required.")

    df["SMA_50"] = ta.sma(df["Close"], length=50)
    df["RSI_14"] = ta.rsi(df["Close"], length=14)

    macd = ta.macd(
        df["Close"],
        fast=12,
        slow=26,
        signal=9
    )

    if macd is None or macd.empty:
        raise ValueError("Unable to calculate MACD.")
    df = df.join(macd)
    latest = df.iloc[-1]

    names = [
        "SMA_50",
        "RSI_14",
        "MACD_12_26_9",
        "MACDs_12_26_9",
        "MACDh_12_26_9",
    ]
    if any(pd.isna(latest[name]) for name in names):
        raise ValueError("Not enough valid data to calculate all indicators.")

    rsi = float(latest["RSI_14"])
    if rsi > 70:
        rsi_signal = "Overbought"
    elif rsi < 30:
        rsi_signal = "Oversold"
    else:
        rsi_signal = "Neutral"

    close = float(latest["Close"])
    sma50 = float(latest["SMA_50"])

    price_vs_sma50 = (
        "above" if close > sma50
        else "below" if close < sma50
        else "equal"
    )

    macd_column = "MACD_12_26_9"
    signal_column = "MACDs_12_26_9"
    histogram_column = "MACDh_12_26_9"
    macd_value = float(latest[macd_column])
    macd_signal = float(latest[signal_column])
    macd_histogram = float(latest[histogram_column])

    return {
        "ticker": ticker.strip().upper(),
        "price": round(close, 2),
        "sma50": round(sma50, 2),
        "priceVsSma50": price_vs_sma50,
        "rsi": round(rsi, 2),
        "rsiSignal": rsi_signal,
        "macd": round(macd_value, 4),
        "macdSignal": round(macd_signal, 4),
        "macdHistogram": round(macd_histogram, 4),
        "macdMomentum": (
            "Bullish" if macd_histogram > 0
            else "Bearish" if macd_histogram < 0
            else "Neutral"
        ),
    }

def verify_indicators(ticker: str) -> None:
    df = get_stock_data_cached(ticker).copy()
    close = df["Close"].astype(float)
    if len(close) < 50:
        raise ValueError("At least 50 daily prices are required.")

    sma_library = ta.sma(close, length=50)
    rsi_library = ta.rsi(close, length=14)
    macd_library = ta.macd(close, fast=12, slow=26, signal=9)

    sma_manual = close.rolling(window=50).mean()

    delta = close.diff()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)

    avg_gain = gains.ewm(
        alpha = 1/14,
        min_periods = 14,
        adjust = False
    ).mean()
    avg_loss = losses.ewm(
        alpha = 1/14,
        min_periods = 14,
        adjust = False
    ).mean()

    relative_strength = avg_gain/ avg_loss
    rsi_manual = 100 - (100 / (1 + relative_strength))

    ema12 = close.ewm(
        span = 12,
        adjust = False,
        min_periods = 12
    ).mean()
    ema26 = close.ewm(
        span = 26,
        adjust = False,
        min_periods = 26
    ).mean()
    macd_manual = ema12 - ema26

    signal_manual = macd_manual.ewm(
        span = 9,
        adjust = False,
        min_periods = 9
    ).mean()
    histogram_manual = macd_manual - signal_manual

    results = {
        "SMA(50)": (
            sma_library.iloc[-1],
            sma_manual.iloc[-1],
        ),
        "RSI(14)": (
            rsi_library.iloc[-1],
            rsi_manual.iloc[-1],
        ),
        "MACD line": (
            macd_library["MACD_12_26_9"].iloc[-1],
            macd_manual.iloc[-1],
        ),
        "MACD signal": (
            macd_library["MACDs_12_26_9"].iloc[-1],
            signal_manual.iloc[-1],
        ),
        "MACD histogram": (
            macd_library["MACDh_12_26_9"].iloc[-1],
            histogram_manual.iloc[-1],
        )
    }

    print(f"\nIndicator verification: {ticker.upper()}")
    print("-" * 65)

    for name, (library_value, manual_value) in results.items():
        if pd.isna(library_value) or pd.isna(manual_value):
            print(f"{name}: NOT CHECKED (missing value).")
            continue

        difference = abs(float(library_value) - float(manual_value))
        print(
            f"{name:18}"
            f"  library = {float(library_value):12.6f}"
            f"  manual = {float(manual_value):12.6f}"
            f"  difference = {difference:8f}"
        )

    latest_rsi = rsi_library.iloc[-1]
    assert 0 <= latest_rsi <= 100, "RSI is outside [0, 100]."

    assert np.isclose(
        sma_library.iloc[-1],
        sma_manual.iloc[-1],
        atol = 1e-6
    ), "SMA calculations do not match."
    assert np.isclose(
        macd_library["MACDh_12_26_9"].iloc[-1],
        (
            macd_library["MACD_12_26_9"].iloc[-1]
            - macd_library["MACDs_12_26_9"].iloc[-1]
        ),
        atol = 1e-6
    ), "MACD histogram identity failed."
    # assert np.isclose(
    #     macd_library["MACDh_12_26_9"].iloc[-1],
    #     histogram_manual.iloc[-1],
    #     atol = 1e-6
    # ), "MACD histogram identity with manual failed."

    print("\nSMA check passed.")
    print("RSI bounds check passed.")
    print("MACD histogram identity check passed.")
    print(
        "Compare the RSI and MACD differences above; "
        "EMA initialisation can cause small differences."
    )

if __name__ == "__main__":
    verify_indicators("RELIANCE.NS")