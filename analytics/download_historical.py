from data import get_historical_stock_data

# Stocks we want to collect data for
TICKERS = [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "SBIN.NS",
    "ITC.NS",
    "LT.NS",
    "BHARTIARTL.NS",
    "^NSEI"
]

START_DATE = "2020-01-01"
END_DATE = "2026-01-01"


def main():
    for ticker in TICKERS:
        print(f"\nDownloading {ticker}...")

        try:
            df = get_historical_stock_data(
                ticker=ticker,
                start_date=START_DATE,
                end_date=END_DATE
            )

            print(f"Successfully downloaded {len(df)} records.")

        except Exception as e:
            print(f"Failed to download {ticker}: {e}")


if __name__ == "__main__":
    main()