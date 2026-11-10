from pprint import pprint
from get_trend import calculate_trend

result = calculate_trend("RELIANCE.NS")
pprint(result)

assert result["price"] > 0
assert result["sma50"] > 0
assert 0 <= result["rsi"] <= 100
assert result["rsiSignal"] in {
    "Overbought",
    "Oversold",
    "Neutral",
}
assert result["macdMomentum"] in {
    "Bullish",
    "Bearish",
    "Neutral",
}

print("\nTrend calculation passed.")