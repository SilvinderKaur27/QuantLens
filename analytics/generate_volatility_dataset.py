from pathlib import Path
import pandas as pd

from historical_volatility import calculate_rolling_historical_volatility

DATA_DIR = Path(__file__).parent / "data" / "historical"

INPUT_FILE = DATA_DIR / "combined_close_prices.csv"
OUTPUT_FILE = DATA_DIR / "rolling_historical_volatility.csv"

WINDOW = 20


def main():

    prices = pd.read_csv(
        INPUT_FILE,
        index_col="Date",
        parse_dates=True
    )

    volatility_data = pd.DataFrame(index=prices.index)

    for ticker in prices.columns:

        print(f"Calculating volatility for {ticker}...")

        volatility_data[ticker] = (
            calculate_rolling_historical_volatility(
                prices[ticker],
                window=WINDOW
            )
        )

    volatility_data.to_csv(OUTPUT_FILE)

    print("\nRolling volatility dataset created.")

    print("Output:", OUTPUT_FILE)
    print("Total dates:", len(volatility_data))
    print("Instruments:", len(volatility_data.columns))

    print("\nLatest volatility values:")

    print(volatility_data.tail(1).T)

    print("\nSummary statistics:")

    print(volatility_data.describe())


if __name__ == "__main__":
    main()