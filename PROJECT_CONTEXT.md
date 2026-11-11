## 13. Historical Research Dataset

A separate historical research pipeline has been developed inside
analytics/.

### Instrument Universe

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

Historical data:
2020-01-01 to 2025-12-31.

Data source:
yfinance.

Downloaded fields:
- Open
- High
- Low
- Close
- Volume

The dataset is an initial research sample. Its representativeness
and limitations must be discussed in the final methodology.

### Data Preparation

Implemented scripts:

- analytics/download_historical.py
- analytics/validate_historical.py
- analytics/prepare_dataset.py
- analytics/calculate_returns.py
- analytics/generate_volatility_dataset.py
- analytics/generate_forward_outcomes.py
- analytics/generate_risk_labels.py
- analytics/build_research_dataset.py
- analytics/create_splits.py

### Features

- Closing prices.
- Daily percentage returns.
- Rolling 20-session annualised historical volatility.

### Outcomes

Direction:
Five-session forward return.

R(t,5) = (P(t+5) - P(t)) / P(t)

Labels:
- Bullish: return > +1%.
- Bearish: return < -1%.
- Neutral: otherwise.

High-risk outcome:
Five-session realised volatility compared with a
per-instrument 75th-percentile threshold calculated using
the 2022–2023 training period.

These labels are operational research definitions, not universal
financial definitions.

### Master Dataset

File:
analytics/data/historical/research_dataset.csv

- 14,620 observations.
- 10 instruments.
- 1,462 observations per instrument.

Direction distribution:
- Bullish: 5,977.
- Bearish: 4,570.
- Neutral: 4,073.

High-risk distribution:
- 9,904 normal-risk observations.
- 4,716 high-risk observations.

### Chronological Splits

Files:
- train_dataset.csv
- validation_dataset.csv
- test_dataset.csv

| Split | Period | Observations |
|---|---|---:|
| Training | 2022–2023 | 4,880 |
| Validation | 2024 | 2,410 |
| Testing | 2025 | 2,390 |

The final five observations per instrument in each period are removed
to avoid forward outcome windows crossing split boundaries.

Never randomly split this time-series dataset.

Use training data to fit thresholds and model parameters.
Use validation data for model selection.
Keep the test period held out until final evaluation.

### Data Limitations

- Historical data was retrieved through yfinance.
- The dataset does not currently contain historical dated news.
- Historical options-chain data has not yet been collected.
- The selected universe is limited to nine equities and one index.
- The dataset should not be treated as representative of all Indian
  equities or all market regimes.
- Corporate actions, ticker survivorship and data-source limitations
  require documentation.
- Historical volatility and forward realised volatility are distinct
  quantities and must not be confused.

## 14. Benchmark Evaluation Design

Planned systems:

- S0: Quantitative-only fixed-rule baseline.
- S1: Single LLM with quantitative metrics.
- S2: Single LLM with quantitative metrics and dated news.
- S3: Structured multi-agent system.
- S4: Ablation experiments removing individual components.

All systems must use:
- Identical decision dates.
- Identical instruments.
- Identical outcome labels.
- Identical information cut-off times.
- Identical held-out test observations.

### Proposed Evaluation Metrics

Direction:
- Accuracy.
- Macro-F1.
- Per-class precision and recall.

High-risk classification:
- Precision.
- Recall.
- F1.
- Confusion matrix.

Probability quality, when genuine probabilities are produced:
- Brier score.
- Log loss.
- Calibration analysis.

Evidence quality:
- Evidence-support fraction.
- Unsupported-claim rate.
- Source verification.

Operational performance:
- Latency.
- API cost.
- Failure rate.

Do not treat heuristic alignment scores as probabilities.

Do not report experimental superiority until all systems have been
evaluated on the same held-out observations.

## 15. Current Implementation Status

Completed:
- Original Flask analytics engine.
- Express orchestration.
- Five specialist/synthesis agents.
- Gemini integration.
- Historical data preparation.
- Outcome-label generation.
- Chronological dataset splits.

Not yet confirmed:
- S0 execution.
- S1–S4 implementations.
- Research-grade benchmark results.
- News data collection.
- Evidence-grounding evaluation.
- Probability calibration.

## 16. Updated Development Priorities

1. Verify dataset alignment and leakage controls.
2. Implement and test S0.
3. Implement S1 and S2.
4. Implement S3 using the existing agent architecture.
5. Implement S4 ablations.
6. Run held-out evaluation.
7. Add dated source-grounded financial news.
8. Add fundamental analysis.
9. Evaluate uncertainty and evidence quality.
10. Complete the research paper and report.

## 17. Development Rules

Retain all existing development rules.

Additional rules:
- Keep historical research data separate from live analysis.
- Never use future information in decision-time features.
- Fit thresholds on training data only.
- Use validation for tuning and test for final evaluation.
- Preserve identical test cases across benchmark variants.
- Record model version, prompt, data inputs and timestamp for every
  LLM experiment.
- Distinguish actual historical market data from theoretical
  Black-Scholes outputs.
- Record every experiment reproducibly.