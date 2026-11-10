from flask import Flask, jsonify, request
from data import get_stock_data_cached
from get_trend import calculate_trend
from blackscholes import (
    black_scholes_call,
    black_scholes_put,
    delta,
    theta
)
import math
from historical_volatility import calculate_historical_volatility

app = Flask(__name__)
@app.get("/health")
def health():
    return jsonify(
        ok=True,
        service="stock-helper-analytics"
    )

@app.get("/prices")
def prices():
    ticker = request.args.get("ticker", "").strip().upper()
    if not ticker:
        return jsonify(error = "Ticker is required."), 400
    try:
        df = get_stock_data_cached(ticker)
        history = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"])
            }
            for date, row in df.iterrows()
        ]
        return jsonify(
            ticker = ticker,
            lastClose = history[-1]["close"],
            count = len(history),
            history = history
        )
    except ValueError as error:
        return jsonify(error = str(error)), 400
    except Exception:
        app.logger.exception("Failed to fetch stock prices.")
        return jsonify(error = "Unable to fetch stock price data. Please try again."), 502

@app.get("/trend")
def trend():
    ticker = request.args.get("ticker", "").strip().upper()
    if not ticker:
        return jsonify(error = "Ticker is required."), 400

    try:
        result = calculate_trend(ticker)
        return jsonify(result)
    except ValueError as error:
        return jsonify(error = str(error)), 400
    except Exception:
        app.logger.exception("Trend calculation failed.")
        return jsonify(
            error = "Unable to calculate trend indicators."
        ), 502

@app.get("/options")
def options():
    ticker = request.args.get("ticker", "").strip().upper()
    if not ticker:
        return jsonify(error = "Ticker is required."), 400

    try:
        strike = float(request.args.get("strike", ""))
        days = float(request.args.get("days", ""))
        rate = float(request.args.get("rate", ""))
        # volatility = float(request.args.get("volatility", ""))
    except (TypeError, ValueError):
        return jsonify(error = "Provide numeric strike, days and rate values."), 400

    raw_volatility = request.args.get("volatility")
    supplied_volatility = None
    if raw_volatility is not None:
        try:
            supplied_volatility = float(raw_volatility)
        except (TypeError, ValueError):
            return jsonify(error = "Volatility must be a valid number."), 400

    numeric_values = [strike, days, rate]
    if supplied_volatility is not None: numeric_values.append(supplied_volatility)
    if not all(map(lambda x: __import__("math").isfinite(x), numeric_values)):
        return jsonify(error = "All inputs must be finite numbers."), 400

    if strike <= 0:
        return jsonify(error = "Strike must be greater than zero."), 400
    if days <= 0:
        return jsonify(error = "Days to expiry must be greater than zero."), 400
    if supplied_volatility is not None and supplied_volatility <= 0:
        return jsonify(error = "Volatility must be greater than zero."), 400

    try:
        df = get_stock_data_cached(ticker)
        if df.empty or "Close" not in df.columns:
            return jsonify(error = "No stock price data found for this ticker."), 404

        spot = float(df["Close"].iloc[-1])
        if not __import__("math").isfinite(spot) or spot <= 0:
            return jsonify(error = "Latest stock price is invalid."), 502

        if supplied_volatility is None:
            volatility = calculate_historical_volatility(df["Close"])
            volatility_source = "annualized historical volatility"
        else:
            volatility = supplied_volatility
            volatility_source = "user-supplied volatility"

        time_to_expiry = days/ 365.0
        def price_at_stock_price(scenario_spot):
            call_price = black_scholes_call(scenario_spot, strike, time_to_expiry, rate, volatility)
            put_price = black_scholes_put(scenario_spot, strike, time_to_expiry, rate, volatility)
            call_delta = delta(scenario_spot, strike, time_to_expiry, rate, volatility, option_type = "call")
            put_delta = delta(scenario_spot, strike, time_to_expiry, rate, volatility, option_type = "put")
            call_theta = theta(scenario_spot, strike, time_to_expiry, rate, volatility, option_type = "call")
            put_theta = theta(scenario_spot, strike, time_to_expiry, rate, volatility, option_type = "put")

            return {
                "call": {
                    "price": round(call_price, 6),
                    "delta": round(call_delta, 6),
                    "theta_per_day": round(call_theta, 6)
                },
                "put": {
                    "price": round(put_price, 6),
                    "delta": round(put_delta, 6),
                    "theta_per_day": round(put_theta, 6)
                }
            }
        base_result = price_at_stock_price(spot)
        scenario_changes = [-0.10, -0.05, 0.0, 0.05, 0.10]
        scenarios = []

        for change in scenario_changes:
            scenario_spot = spot * (1 + change)
            result = price_at_stock_price(scenario_spot)

            scenarios.append({
                "stock_change_percent": round(change * 100, 2),
                "scenario_spot": round(scenario_spot, 4),
                "call": result["call"],
                "put": result["put"]
            })

        return jsonify(
            ticker = ticker,
            model = "Black-Scholes",
            exercise_style = "European",
            assumptions = {
                "risk_free_rate": rate,
                "volatility": round(volatility, 8),
                "volatility_source": volatility_source,
                "days_to_expiry": days,
                "time_to_expiry_years": time_to_expiry,
                "dividend_yield": 0
            },
            inputs = {
                "spot": round(spot, 4),
                "strike": strike
            },
            call = base_result["call"],
            put = base_result["put"],
            scenarios = scenarios,
            price_source = "Latest available closing price; not necessarily a live quote."
        )
    except ValueError as error:
        return jsonify(error = str(error)), 400
    except Exception:
        app.logger.exception("Option pricing failed.")
        return jsonify(error = "Unable to calculate option prices."), 502

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)