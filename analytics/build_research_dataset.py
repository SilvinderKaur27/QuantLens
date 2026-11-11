from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data" / "historical"

FILES = {
    "prices": "combined_close_prices.csv",
    "returns": "daily_returns.csv",
    "volatility": "rolling_historical_volatility.csv",
    "forward_returns": "five_session_forward_returns.csv",
    "direction": "five_session_outcome_labels.csv",
    "realized_volatility": "five_session_realized_volatility.csv",
    "risk": "high_risk_labels.csv",
}

OUTPUT_FILE = DATA_DIR / "research_dataset.csv"


def main():

    datasets = {}

    for name, filename in FILES.items():
        datasets[name] = pd.read_csv(
            DATA_DIR / filename,
            index_col="Date",
            parse_dates=True
        )

    records = []

    for ticker in datasets["prices"].columns:

        df = pd.DataFrame(index=datasets["prices"].index)

        df["ticker"] = ticker
        df["close"] = datasets["prices"][ticker]
        df["daily_return"] = datasets["returns"][ticker]
        df["historical_volatility"] = datasets["volatility"][ticker]
        df["forward_return_5d"] = datasets["forward_returns"][ticker]
        df["direction_label"] = datasets["direction"][ticker]
        df["realized_volatility_5d"] = datasets["realized_volatility"][ticker]
        df["high_risk_label"] = datasets["risk"][ticker]

        df = df.reset_index()
        records.append(df)

    research_data = pd.concat(records, ignore_index=True)

    research_data = research_data.dropna(
        subset=[
            "historical_volatility",
            "forward_return_5d",
            "direction_label",
            "realized_volatility_5d",
            "high_risk_label"
        ]
    )

    research_data = research_data.sort_values(
        ["ticker", "Date"]
    )

    research_data.to_csv(OUTPUT_FILE, index=False)

    print("Research dataset created successfully.")
    print("\nTotal observations:", len(research_data))
    print("Total instruments:", research_data["ticker"].nunique())

    print("\nObservations per instrument:")
    print(research_data["ticker"].value_counts())

    print("\nDirection distribution:")
    print(research_data["direction_label"].value_counts())

    print("\nHigh-risk distribution:")
    print(research_data["high_risk_label"].value_counts())

    print("\nSaved to:", OUTPUT_FILE)


if __name__ == "__main__":
    main()