# QuantLens — Development Progress

Last updated: 12 November 2026

## Current Milestones

1. Backend quantitative analysis, five-agent orchestration and Gemini
   integration successfully tested.
2. Historical research dataset generated and chronologically split.
3. S0–S4 benchmark implementation is the next major milestone.

## Completed

### Environment and Setup
- Node.js and npm configured.
- Python 3.12 virtual environment configured.
- Flask analytics service running on port 5001.
- Express backend running on port 5000.
- Gemini API configured through server/.env.

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
- Combined /api/analyze endpoint.
- Gemini structured explanation.
- Error handling that preserves analytical results if AI generation fails.

### End-to-End Verification
Successfully tested POST /api/analyze.

Test ticker: RELIANCE.NS

All five agents completed successfully.
Gemini returned a structured summary and options outlook.
AI status: completed.

### Historical Research Dataset

Historical data downloaded using yfinance for:

- RELIANCE.NS
- TCS.NS
- INFY.NS
- HDFCBANK.NS
- ICICIBANK.NS
- SBIN.NS
- ITC.NS
- LT.NS
- BHARTIARTL.NS
- ^NSEI

Historical period:
2020-01-01 to 2025-12-31.

Completed:
- Historical OHLCV download.
- Data quality validation.
- Combined closing-price dataset.
- Daily percentage returns.
- Rolling 20-session annualised historical volatility.
- Five-session forward returns.
- Direction outcome labels.
- Five-session realised volatility.
- High-risk labels.
- Training-period volatility thresholds.
- Master research dataset.
- Chronological train/validation/test splits.

Validation results:
- No missing OHLCV values in downloaded files.
- No duplicate dates.
- No invalid OHLC prices.
- No negative volume.
- No inconsistent OHLC relationships.
- One date differed between the common trading calendars.

### Dataset Statistics

Master dataset:
- 14,620 observations.
- 10 instruments.
- 1,462 observations per instrument.

Direction distribution:
- Bullish: 5,977.
- Bearish: 4,570.
- Neutral: 4,073.

High-risk distribution:
- Normal risk: 9,904.
- High risk: 4,716.

Chronological splits:

| Split | Period | Observations |
|---|---|---:|
| Training | 2022–2023 | 4,880 |
| Validation | 2024 | 2,410 |
| Testing | 2025 | 2,390 |

The final five observations per instrument in each split were excluded
to prevent five-session forward outcomes from crossing split boundaries.

## Current Research Data Files

Location:
analytics/data/historical/

Important files:
- combined_close_prices.csv
- daily_returns.csv
- rolling_historical_volatility.csv
- five_session_forward_returns.csv
- five_session_outcome_labels.csv
- five_session_realized_volatility.csv
- high_risk_labels.csv
- high_risk_thresholds.csv
- research_dataset.csv
- train_dataset.csv
- validation_dataset.csv
- test_dataset.csv

## Pending Development

### Historical Evaluation
- Verify feature and outcome alignment.
- Verify chronological split boundaries.
- Implement S0 quantitative-only baseline.
- Implement S1 single-LLM baseline.
- Implement S2 single-LLM with dated news.
- Implement S3 multi-agent system.
- Implement S4 ablation experiments.
- Compare systems on identical test observations.

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
- Connect frontend to /api/analyze.
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
- Write final research paper and project report.

## Important Research Limitations

The following have NOT yet been demonstrated:

- Predictive accuracy.
- Superiority over single-LLM systems.
- Superiority over quantitative-only systems.
- Improved reliability from multi-agent collaboration.
- Calibrated confidence.
- Improved event-aware risk assessment.

Generated datasets and proposed benchmark code are not experimental
evidence of system superiority.

## Next Immediate Development Task

Verify the historical dataset and implement the S0 quantitative-only
baseline.

After that, implement the remaining S1–S4 benchmark variants.

## GitHub

Repository:
https://github.com/SilvinderKaur27/QuantLens

Latest previously confirmed commit:
352c9aa — integrate Gemini AI with multi-agent analysis

The historical research pipeline has been created locally.
Its GitHub commit/push status has not been verified.

Check git status before committing.

## Working Instructions

- Windows CMD.
- Use .venv312 for Python analytics.
- Keep Flask and Express in separate terminals when needed.
- Use a third terminal for API tests.
- Explain each coding step simply.
- Make small, focused changes.
- Inspect existing code before suggesting modifications.
- Never commit .env.
- Keep both context files updated after major milestones.