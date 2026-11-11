from pathlib import Path
import pandas as pd
import numpy as np

DATA_DIR = Path(__file__).parent / "data" / "historical"

INPUT_FILE = DATA_DIR / "daily_returns.csv"

VOLATILITY_FILE = DATA_DIR / "five_session_realized_volatility.csv"
LABEL_FILE = DATA_DIR / "high_risk_labels.csv"
THRESHOLD_FILE = DATA_DIR / "high_risk_thresholds.csv"

FORWARD_DAYS = 5
TRADING_DAYS = 252

TRAIN_START = "2022-01-01"
TRAIN_END = "2023-12-31"

RISK_PERCENTILE = 75


def main():

    returns = pd.read_csv(
        INPUT_FILE,
        index_col="Date",
        parse_dates=True
    )

    realized_volatility = pd.DataFrame(index=returns.index)

    # Calculate future volatility independently for each instrument
    for ticker in returns.columns:

        future_returns = pd.concat(
            [
                returns[ticker].shift(-i)
                for i in range(1, FORWARD_DAYS + 1)
            ],
            axis=1
        )

        volatility = (
            future_returns.std(axis=1, ddof=1)
            * np.sqrt(TRADING_DAYS)
        )

        # Require all five future returns
        volatility = volatility.where(
            future_returns.notna().all(axis=1)
        )

        realized_volatility[ticker] = volatility

    # Calculate training-period thresholds separately per instrument
    training_mask = (
        (realized_volatility.index >= TRAIN_START)
        & (realized_volatility.index <= TRAIN_END)
    )

    thresholds = realized_volatility.loc[training_mask].quantile(
        RISK_PERCENTILE / 100
    )

    # Generate binary high-risk labels
    labels = realized_volatility.gt(thresholds).astype(float)

    labels = labels.where(realized_volatility.notna())

    # Save datasets
    realized_volatility.to_csv(VOLATILITY_FILE)
    labels.to_csv(LABEL_FILE)
    thresholds.to_frame(name="threshold").to_csv(THRESHOLD_FILE)

    print("\nHigh-risk datasets generated successfully.")

    print("\nTotal dates:", len(realized_volatility))
    print("Total instruments:", len(realized_volatility.columns))

    print("\nTraining-derived thresholds:")
    print(thresholds)

    print("\nLatest realised volatility:")
    print(realized_volatility.tail())

    print("\nHigh-risk label distribution:")

    for ticker in labels.columns:
        print(f"\n{ticker}")
        print(labels[ticker].value_counts(dropna=True))

    print("\nFiles saved:")
    print(VOLATILITY_FILE)
    print(LABEL_FILE)
    print(THRESHOLD_FILE)


if __name__ == "__main__":
    main()