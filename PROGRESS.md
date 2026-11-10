# QuantLens — Development Progress

Last updated: 10 November 2026

## Current Milestone

**Backend quantitative analysis, five-agent orchestration and Gemini integration successfully tested.**

## Completed

### Environment and Setup
- Node.js and npm configured.
- Python 3.12 virtual environment configured for Flask.
- Flask analytics service running on port 5001.
- Express backend running on port 5000.
- Gemini API configured through `server/.env`.

### Quantitative Analytics
- Historical stock data retrieval using yfinance.
- SMA50.
- RSI14.
- MACD.
- Historical volatility.
- Black-Scholes European call and put pricing.
- Delta and Theta.
- Five theoretical option-price scenarios.

### Agent System
- Technical Agent.
- Options Agent.
- Risk Scenario Agent.
- Market Risk Agent.
- Synthesis Agent.

### Backend Integration
- Express API routes.
- Flask proxy routes.
- Input validation.
- Five-agent orchestration.
- Combined `/api/analyze` endpoint.
- Gemini structured explanation.
- Error handling that preserves analytical results if AI generation fails.

### End-to-End Verification

Successfully tested:

`POST /api/analyze`

Test ticker: RELIANCE.NS

All five agents completed successfully.

Gemini returned:
- Summary.
- Options outlook.
- AI status: completed.

The backend is operational for the tested case.

## Current Architecture

```text
React + Vite
     |
     v
Express Backend
     |
     +---- Technical Agent
     +---- Options Agent
     +---- Risk Scenario Agent
     +---- Market Risk Agent
     +---- Synthesis Agent
     |
     +---- Gemini Explanation
     |
     v
Flask Quantitative Engine
     |
     +---- yfinance
     +---- Technical Indicators
     +---- Historical Volatility
     +---- Black-Scholes
     +---- Greeks
     +---- Scenarios
```

## Pending Development

### Quantitative and Historical Evaluation
- Historical backtesting engine.
- Five-session forward return labels.
- Chronological data splits.
- Historical performance metrics.
- S0–S4 benchmarking.
- Ablation experiments.

### Financial Intelligence
- Fundamentals Agent.
- News and Event Intelligence Agent.
- Dated news retrieval.
- Evidence/source verification.
- Historical options-chain analysis.
- Implied volatility and open-interest analysis.
- Additional Greeks.

### AI and Evaluation
- Confidence calibration.
- Evidence-support evaluation.
- Unsupported-claim evaluation.
- Gemini retry/fallback handling.
- Model comparison.

### Frontend
- Verify current React/Vite implementation.
- Connect the frontend to `/api/analyze`.
- Historical price charts.
- Technical indicator visualisations.
- Options dashboard.
- Scenario visualisation.
- Agent findings.
- Gemini explanation.
- Risk and uncertainty display.

### Final Research Work
- Review research papers.
- Verify mathematical formulas against original sources.
- Establish research gaps.
- Execute benchmark experiments.
- Analyse results.
- Write the final research paper and project report.

## Important Research Limitations

The following have NOT yet been demonstrated:

- Predictive accuracy.
- Superiority over single-LLM systems.
- Superiority over quantitative-only systems.
- Improved reliability from multi-agent collaboration.
- Calibrated confidence.
- Improved event-aware risk assessment.

These claims require experiments.

## Next Immediate Development Task

Build the historical backtesting engine before adding more agents.

Initial proposed universe:
- RELIANCE.NS
- TCS.NS
- INFY.NS
- HDFCBANK.NS
- ICICIBANK.NS
- NIFTY 50 benchmark: `^NSEI`

The final universe and historical period must be documented and justified.

## GitHub

Repository:

https://github.com/SilvinderKaur27/QuantLens

Latest confirmed commit:

`352c9aa` — integrate Gemini AI with multi-agent analysis

The combined `/api/analyze` endpoint was subsequently tested successfully. Check `git status` before the next commit because its latest changes may not yet be pushed.

## Working Instructions

- Windows CMD.
- Use `.venv312` for Flask.
- Keep Flask and Express running in separate terminals.
- Use a third terminal for API tests.
- Explain each coding step simply.
- Make small, focused changes.
- Never commit `.env`.
- Keep the project context updated.