from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data" / "historical"

INPUT_FILE = DATA_DIR / "combined_close_prices.csv"
OUTPUT_FILE = DATA_DIR / "daily_returns.csv"


def main():

    prices = pd.read_csv(
        INPUT_FILE,
        index_col="Date",
        parse_dates=True
    )

    # Calculate daily percentage returns
    returns = prices.pct_change(fill_method=None)

    # Remove the first row because it has no previous trading day
    returns = returns.dropna()

    # Save results
    returns.to_csv(OUTPUT_FILE)

    print("Daily returns calculated successfully.")

    print("\nTotal observations:", len(returns))
    print("Total instruments:", len(returns.columns))

    print("\nFirst five rows:")
    print(returns.head())

    print("\nSummary statistics:")
    print(returns.describe())


if __name__ == "__main__":
    main()