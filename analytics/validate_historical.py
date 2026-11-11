from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data" / "historical"

REQUIRED_COLUMNS = ["Open", "High", "Low", "Close", "Volume"]


def validate_file(filepath):
    df = pd.read_csv(filepath, parse_dates=["Date"])
    df = df.sort_values("Date")

    print(f"\nValidating: {filepath.name}")
    print(f"Total rows: {len(df)}")

    missing = df[REQUIRED_COLUMNS].isna().sum()
    print(f"Missing values:\n{missing}")

    duplicates = df["Date"].duplicated().sum()
    print(f"Duplicate dates: {duplicates}")

    invalid_prices = (
        (df[["Open", "High", "Low", "Close"]] <= 0)
        .any(axis=1)
        .sum()
    )
    print(f"Invalid price rows: {invalid_prices}")

    invalid_volume = (df["Volume"] < 0).sum()
    print(f"Negative volume rows: {invalid_volume}")

    invalid_ohlc = (
        (df["High"] < df[["Open", "Close", "Low"]].max(axis=1))
        |
        (df["Low"] > df[["Open", "Close", "High"]].min(axis=1))
    ).sum()
    print(f"Inconsistent OHLC rows: {invalid_ohlc}")

    return set(df["Date"])


def main():
    files = list(DATA_DIR.glob("*.csv"))

    if not files:
        print("No historical CSV files found.")
        return

    date_sets = {}

    for filepath in files:
        date_sets[filepath.name] = validate_file(filepath)

    common_dates = set.intersection(*date_sets.values())
    all_dates = set.union(*date_sets.values())

    print("\n===== DATE ALIGNMENT =====")
    print(f"Total unique trading dates: {len(all_dates)}")
    print(f"Dates common to all instruments: {len(common_dates)}")

    for name, dates in date_sets.items():
        missing_dates = sorted(all_dates - dates)

        print(f"\n{name}")
        print(f"Missing dates relative to union: {len(missing_dates)}")

        if missing_dates:
            print("Missing dates:", missing_dates[:10])


if __name__ == "__main__":
    main()