import math
import pytest

from historical_volatility import calculate_historical_volatility

def test_constant_daily_growth_has_zero_volatility():
    prices = [100, 110, 121, 133.1]
    result = calculate_historical_volatility(prices)

    assert result == pytest.approx(0, abs = 1e-10)

def test_annualized_volatility_matches_manual_calculation():
    prices = [100, 102, 99, 103, 101]
    returns = [
        math.log(prices[i]/ prices[i - 1])
        for i in range(1, len(prices))
    ]
    mean_return = sum(returns)/ len(returns)
    variance = sum((value - mean_return) ** 2 for value in returns)/ (len(returns) - 1)
    expected = math.sqrt(variance * 252)

    result = calculate_historical_volatility(prices)
    assert result == pytest.approx(expected)

@pytest.mark.parametrize("prices", [
    [],
    [100],
    [100, 101],
    [100, 0, 102],
    [100, -1, 102]
])
def test_invalid_or_insufficient_prices_are_rejected(prices):
    with pytest.raises(ValueError):
        calculate_historical_volatility(prices)

def test_non_numeric_values_are_dropped():
    prices = [100, 102, "invalid", 101, 105]

    result = calculate_historical_volatility(prices)
    assert math.isfinite(result)
    assert result >= 0