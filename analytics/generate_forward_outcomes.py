from pathlib import Path
import pandas as pd
import numpy as np

DATA_DIR = Path(__file__).parent / "data" / "historical"

INPUT_FILE = DATA_DIR / "combined_close_prices.csv"

RETURN_FILE = DATA_DIR / "five_session_forward_returns.csv"
LABEL_FILE = DATA_DIR / "five_session_outcome_labels.csv"

FORWARD_DAYS = 5

BULLISH_THRESHOLD = 0.01
BEARISH_THRESHOLD = -0.01


def main():

    prices = pd.read_csv(
        INPUT_FILE,
        index_col="Date",
        parse_dates=True
    )

    # Price after five trading sessions
    future_prices = prices.shift(-FORWARD_DAYS)

    # Calculate five-session forward returns
    forward_returns = (future_prices / prices) - 1

    # Generate outcome labels
    labels = pd.DataFrame(
        index=forward_returns.index,
        columns=forward_returns.columns
    )

    labels = labels.mask(
        forward_returns > BULLISH_THRESHOLD,
        "Bullish"
    )

    labels = labels.mask(
        forward_returns < BEARISH_THRESHOLD,
        "Bearish"
    )

    labels = labels.mask(
        forward_returns.notna() & labels.isna(),
        "Neutral"
    )

    # Save datasets
    forward_returns.to_csv(RETURN_FILE)
    labels.to_csv(LABEL_FILE)

    print("Five-session forward outcomes generated.")

    print("\nTotal dates:", len(forward_returns))

    print("\nForward returns:")
    print(forward_returns.tail(10))

    print("\nOutcome labels:")
    print(labels.tail(10))

    print("\nLabel distribution:")

    for ticker in labels.columns:
        print(f"\n{ticker}")
        print(labels[ticker].value_counts(dropna=True))


if __name__ == "__main__":
    main()