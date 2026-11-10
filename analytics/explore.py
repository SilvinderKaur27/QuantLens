from data import get_stock_data

df = get_stock_data("RELIANCE.NS")
print("\nFirst five rows:")
print(df.head())

print("\nLatest available row:")
print(df.iloc[-1])

print("\nSummary statistics:")
print(df.describe())

print("\nLatest closing prices:")
print(df["Close"].tail())