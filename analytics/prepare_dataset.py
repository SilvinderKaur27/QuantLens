from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data" / "historical"

OUTPUT_FILE = DATA_DIR / "combined_close_prices.csv"


def main():

    files = list(DATA_DIR.glob("*.csv"))

    if not files:
        print("No historical CSV files found.")
        return

    close_prices = []

    for filepath in files:

        df = pd.read_csv(
            filepath,
            parse_dates=["Date"],
            index_col="Date"
        )

        # Extract ticker from filename
        ticker = filepath.name.split("_2020")[0]

        if "Close" not in df.columns:
            print(f"Skipping {filepath.name}: Close column missing.")
            continue

        close_series = df["Close"].rename(ticker)

        close_prices.append(close_series)

    combined = pd.concat(close_prices, axis=1)

    # Keep only dates available for every instrument
    combined = combined.dropna()

    combined = combined.sort_index()

    combined.to_csv(OUTPUT_FILE)

    print("\nCombined dataset created successfully.")
    print("Output:", OUTPUT_FILE)
    print("Total dates:", len(combined))
    print("Total instruments:", len(combined.columns))

    print("\nFirst five rows:")
    print(combined.head())

    print("\nLast five rows:")
    print(combined.tail())


if __name__ == "__main__":
    main()