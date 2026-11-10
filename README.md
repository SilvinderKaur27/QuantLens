# Prot

# StockLens — AI Stock & Options Helper

StockLens is a learning-oriented stock-analysis prototype built with React,
Express, and Python. It calculates technical indicators and theoretical
European option prices, then uses an AI model to explain the computed results.

## Features

- Stock history and latest available price.
- SMA (50), RSI (14), and MACD (12, 26, 9).
- Bullish, Bearish, or Neutral stock outlook.
- Separate broader-market outlook using a configurable market benchmark.
- Indicator-alignment score out of 100 for each outlook.
- Black–Scholes call and put prices.
- Delta and per-day Theta.
- Historical-volatility calculation and optional volatility override.
- Five stock-price scenarios: -10%, -5%, 0%, +5%, +10%.
- Configurable annual risk-free rate.
- AI-generated plain-English interpretation of calculated results.

## Technology

- React and Vite
- Node.js and Express
- Python and Flask
- pandas, NumPy, yfinance, pandas-ta
- Google Gemini API

## Architecture

React frontend
    -> Express API
        -> Flask/Python analytics service
        -> Gemini API for explanations

Python performs the financial calculations. The AI explains the returned
results; it is not the source of the numerical calculations or outlook scores.

## Requirements

- Node.js and npm
- Python 3
- A Google Gemini API key

## Configuration

Create a server-side `.env` file using the project's existing server setup:

GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=5000
PYTHON_URL=http://127.0.0.1:5001

Never commit `.env` or expose the API key in frontend code.

## Run locally

### 1. Python analytics service

Open a terminal in the analytics directory, activate your Python virtual
environment, install the dependencies from the project's requirements file,
and start the Flask application using the existing entry point.

### 2. Express server

Open another terminal in the server directory, install the Node dependencies
if needed, and start the Express application using the existing start script.

### 3. React frontend

Open a third terminal in the client directory:

npm install
npm run dev

Open the local URL printed by Vite.

## Risk-free rate

The frontend accepts the annual risk-free rate as a percentage.
For example, 5% is converted to 0.05 before being sent to the options API.

This is a user-configured model assumption, not a live market quote.

## Confidence Outlook score

Each outlook is classified as Bullish, Bearish, or Neutral using the available
SMA, RSI, and MACD signals.

The score is a deterministic indicator-alignment heuristic on a 0–100 scale.
It is not a calibrated probability, a guarantee, or an estimate that a price
will move in a particular direction.

If too few indicators are available, the app does not manufacture a score.

The individual-stock outlook and broader-market outlook use separate data.

## Model assumptions and limitations

- Black–Scholes produces theoretical prices, not guaranteed market prices.
- The model currently uses the project's European-option assumptions.
- Historical volatility is not the same as implied volatility.
- Technical indicators describe historical price behaviour and can conflict.
- The market outlook depends on the selected benchmark and available data.
- AI wording can be imperfect, so explanations should be checked against the
  calculated inputs and outputs.
- This project is for learning and demonstration, not investment advice.

## Testing checklist

- Verify the Flask and Express health endpoints.
- Test multiple valid stock tickers.
- Test invalid tickers and missing inputs.
- Verify the risk-free rate conversion.
- Verify option prices, Greeks, and all five scenarios.
- Verify both outlook labels and scores.
- Verify that insufficient data produces no fabricated score.
- Verify the AI explanation uses current backend results.
- Confirm no API keys are tracked by Git.

## Demo walkthrough

1. Enter a stock ticker and market benchmark.
2. Show SMA, RSI, MACD, and the two directional outlooks.
3. Explain what the 0–100 indicator-alignment score means.
4. Show call and put prices, Delta, Theta, and the five scenarios.
5. Change the risk-free rate and rerun the analysis.
6. Show the AI explanation and explain that Python calculates the numbers.

## Future improvements

- Add a historical price chart.
- Add more Greeks and stronger numerical tests.
- Evaluate the outlook rules against historical data before making claims
  about predictive performance."# QuantLens" 
