import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data" / "historical"

df = pd.read_csv(
    DATA_DIR / "research_dataset.csv",
    parse_dates=["Date"]
)

df = df.sort_values(["ticker", "Date"])

periods = {
    "train": ("2022-01-01", "2023-12-31"),
    "validation": ("2024-01-01", "2024-12-31"),
    "test": ("2025-01-01", "2025-12-31")
}

for split_name, (start, end) in periods.items():

    split = df[
        (df["Date"] >= start) &
        (df["Date"] <= end)
    ].copy()

    # Remove the final 5 observations from each instrument
    groups = []

    for ticker, group in split.groupby("ticker"):
        groups.append(group.iloc[:-5])

    split = pd.concat(groups, ignore_index=True)

    output_path = DATA_DIR / f"{split_name}_dataset.csv"
    split.to_csv(output_path, index=False)

    print(f"\n{split_name.upper()} DATASET")
    print("Observations:", len(split))
    print("Date range:", split["Date"].min(), "to", split["Date"].max())
    print("Instruments:", split["ticker"].nunique())
    print("Saved:", output_path)