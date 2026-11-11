import math
import pandas as pd

def calculate_historical_volatility(closing_prices) -> float:


    prices = pd.to_numeric(
        pd.Series(closing_prices),
        errors = "coerce"
    ).dropna()

    if len(prices) < 3:
        raise ValueError("At least three valid closing prices are required.")
    if not all(math.isfinite(float(price)) and price > 0 for price in prices):
        raise ValueError("Closing prices must be finite and greater than zero.")

    log_returns = [
        math.log(float(prices.iloc[i])/ float(prices.iloc[i - 1]))
        for i in range(1, len(prices))
    ]
    if len(log_returns) < 2:
        raise ValueError("At least two daily returns are required.")
    
    mean_return = sum(log_returns)/ len(log_returns)
    squared_deviations = [
        (daily_return - mean_return) ** 2
        for daily_return in log_returns
    ]

    sample_variance = sum(squared_deviations)/ (len(squared_deviations) - 1)
    daily_volatility = math.sqrt(sample_variance)
    annualized_volatility = daily_volatility * math.sqrt(252)

    if not math.isfinite(annualized_volatility):
        raise ValueError("Calculated volatility is not finite.")
    return annualized_volatility

def calculate_rolling_historical_volatility(
    closing_prices,
    window: int = 20
) -> pd.Series:

    prices = pd.to_numeric(
        pd.Series(closing_prices),
        errors="coerce"
    )

    if window < 3:
        raise ValueError("Window must be at least 3.")

    if prices.isna().any():
        raise ValueError("Closing prices contain missing or invalid values.")

    if len(prices) < window:
        raise ValueError("Not enough closing prices for the selected window.")

    if not all(
        math.isfinite(float(price)) and price > 0
        for price in prices
    ):
        raise ValueError("Closing prices must be finite and greater than zero.")

    volatility = prices.rolling(window=window).apply(
        lambda window_prices: calculate_historical_volatility(window_prices),
        raw=False
    )

    return volatility