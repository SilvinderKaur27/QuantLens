# QuantLens — Project Context

## 1. Project Overview

QuantLens is an AI-powered financial intelligence and options decision-support platform.

Its purpose is to combine quantitative financial analysis with AI-generated explanations to help users understand market conditions, stock indicators, and options-related scenarios.

### Core Principle

**Python calculates. AI agents interpret. Node.js coordinates. React displays.**

All financial calculations should be deterministic and handled by the quantitative backend. The LLM must never be responsible for calculating financial indicators, option prices, Greeks, or numerical outputs.

The platform is intended for educational and decision-support purposes, not as a source of guaranteed investment advice.

## 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, Vite | Dashboard and user interface |
| Backend / Orchestration | Node.js, Express | API routes and coordination |
| Quantitative Service | Python, Flask | Financial calculations |
| AI | Google Gemini (`@google/genai`) | Interpretation and explanations |
| Market Data | yfinance | Stock market data |
| Visualization | Chart.js / frontend charts | Displaying financial information |

## 3. Project Structure

The repository has three main components:

- `client/` — React frontend.
- `server/` — Express backend and AI orchestration.
- `analytics/` — Python Flask service and quantitative calculations.

Important files identified so far:

### Analytics
- `analytics/app.py`
- `analytics/blackscholes.py`
- `analytics/data.py`
- `analytics/get_trend.py`
- `analytics/historical_volatility.py`
- `analytics/test_blackscholes.py`
- `analytics/test_historical_volatility.py`
- `analytics/test_trend_manual.py`

### Server
- `server/package.json`
- `server/orchestrator/runAnalysis.js`
- Agent modules and API routes (exact implementation to be verified).

### Client
- React/Vite application (individual components and pages to be documented after code review).

## 4. Quantitative Features

The project report describes the following quantitative features:

- Stock price retrieval.
- Simple Moving Average (SMA 50).
- Relative Strength Index (RSI 14).
- MACD (12, 26, 9).
- Log returns.
- Annualized historical volatility.
- Black–Scholes option pricing.
- Option Delta and Theta.
- Five stock-price scenario calculations.
- Confidence Outlook: Bullish, Neutral, or Bearish, with a score from 0–100.

**Important:** The Confidence Outlook score represents indicator alignment. It must not be presented as a statistically calibrated probability.

These features must be tested against the actual implementation before being considered complete.

## 5. AI Agent Architecture

The project is designed around specialist agents that interpret quantitative and market information.

The intended architecture includes:

- Technical analysis.
- Options analysis.
- Risk analysis.
- Market risk analysis.
- A final synthesis / explanation layer.

The current implementation and orchestration of each agent must be inspected. Do not assume that every planned agent is fully implemented merely because its module exists.

### AI Design Rule

AI agents should:
- Interpret calculated metrics.
- Explain market conditions.
- Identify risks and conflicting signals.
- Provide understandable summaries.
- Reference the data they used wherever possible.

AI agents should NOT:
- Independently calculate financial values.
- Invent market data.
- Present unsupported claims as facts.
- Treat an indicator score as a guaranteed probability.

## 6. Planned Improvements

The following areas are part of the broader project goals. Their implementation status must be verified:

- News and event retrieval.
- Fundamental analysis.
- Options chain data.
- Implied volatility (IV).
- Put-call ratio (PCR).
- Open interest analysis.
- Additional Greeks: Gamma, Vega, and Rho.
- Agent synthesis and conflict checking.
- Evidence tracing and citations.
- Historical backtesting.
- Benchmarking and evaluation.
- Better error handling and automated tests.
- Improved dashboard views for news, evidence, and analysis.

## 7. Benchmarking and Evaluation

The project report proposes comparing different analysis configurations:

- S0: Quantitative analysis only.
- S1: Single Gemini analysis.
- S2: Single Gemini analysis with dated news.
- S3: Multi-agent analysis.
- S4: Ablation experiments that remove selected features or agents.

Possible evaluation metrics include:

- Accuracy and Macro-F1.
- Mean Absolute Error (MAE) for future realized volatility.
- Brier score and log loss, only when evaluating genuine probabilities for a defined outcome.
- Precision, recall, and F1 for risk-event detection.
- Evidence support and unsupported-claim rate.
- Numerical correctness.
- Latency and API cost.

### Avoiding Data Leakage

- Only use information available at or before the analysis timestamp.
- Use chronological train, validation, and test splits.
- Account for overlapping five-session prediction windows.
- Save predictions before future outcomes are known.

The report describes the benchmark design but does not establish that benchmark results have been successfully produced. Do not claim predictive accuracy without running and validating the experiments.

## 8. Development Rules

1. Inspect existing code before modifying it.
2. Understand the current architecture before adding new features.
3. Keep financial calculations separate from AI interpretation.
4. Avoid unnecessary rewrites.
5. Preserve working functionality.
6. Test each change before moving to the next.
7. Keep dependencies documented.
8. Do not hardcode API keys or secrets.
9. Handle missing market data and API failures gracefully.
10. Document important architectural decisions.

## 9. Development Workflow

Work in small, verifiable steps:

1. Inspect the existing implementation.
2. Run the project.
3. Identify errors and missing functionality.
4. Fix one issue at a time.
5. Test the changes.
6. Update `PROGRESS.md`.
7. Continue to the next feature.

The goal is to build a reliable, working project rather than merely adding features that look complete in a presentation.