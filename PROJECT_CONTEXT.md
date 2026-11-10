# QuantLens — Project Context

Last updated: 10 November 2026

## 1. Project Identity

**Project:** QuantLens — AI-Powered Financial Intelligence and Options Decision Support Platform.

**Institution:** Punjab Engineering College (Deemed to be University), Chandigarh.

**Degree:** B.Tech Mathematics and Computing.

**Department:** Mathematics.

**Project mentor:** Dr. Neeti Gauniyal.

QuantLens is an evidence-grounded financial intelligence and options decision-support platform.

Its purpose is to analyse stocks using multiple dimensions of financial information, identify conflicting signals, evaluate theoretical options risk and produce understandable explanations.

It is an educational decision-support platform, not an automated trading system or personalised investment adviser.

## 2. Core Design Principle

**Python calculates, agents interpret, Express coordinates, React displays.**

- Python/Flask: Financial data retrieval and mathematical calculations.
- Node.js/Express: API gateway, validation and agent orchestration.
- Specialist agents: Analyse different dimensions of financial information.
- Gemini: Interprets calculated evidence; it must not invent or modify financial calculations.
- React/Vite: Displays analysis and visualisations.

Never describe indicator-alignment scores as probabilities or calibrated confidence.

## 3. Current Architecture

```text
React + Vite Frontend
        |
        v
Node.js + Express Backend
        |
        +---- Technical Agent
        |
        +---- Options Agent
        |
        +---- Risk Scenario Agent
        |
        +---- Market Risk Agent
        |
        +---- Synthesis Agent
        |
        +---- Gemini Explanation
        |
        v
Python + Flask Analytics Engine
        |
        +---- yfinance
        +---- Historical prices
        +---- Technical indicators
        +---- Historical volatility
        +---- Black-Scholes
        +---- Greeks
        +---- Option scenarios
```

## 4. Repository and Environment

Repository:
https://github.com/SilvinderKaur27/QuantLens

Local project path:

`C:\Users\kaurs\Downloads\Prot-main (1)\Prot-main`

Main folders:

```text
Prot-main/
  analytics/
  server/
    agents/
    orchestrator/
    ai.js
    index.js
    package.json
  client/
    src/
  PROGRESS.md
  PROJECT_CONTEXT.md
```

Environment:
- Windows CMD.
- Node.js v26.13.0.
- npm 11.20.0.
- Python 3.11 and Python 3.12.
- Flask environment: `.venv312`.
- Flask port: 5001.
- Express port: 5000.
- React/Vite development port: 5173.

Use `.venv312` for Flask analytics.

## 5. Implemented Quantitative Capabilities

The Python analytics service currently supports:

- Historical stock prices through yfinance.
- SMA50.
- RSI14.
- MACD (12, 26, 9).
- Historical volatility.
- European Black-Scholes call and put pricing.
- Call Delta.
- Put Delta.
- Call Theta.
- Put Theta.
- Five theoretical underlying-price scenarios:
  - -10%
  - -5%
  - 0%
  - +5%
  - +10%

Important assumptions:
- European options.
- Zero dividend yield in the current implementation.
- Time to expiry calculated using days/365.
- Risk-free rate entered as a decimal.
- Historical volatility used when no volatility override is supplied.
- Latest available close is not necessarily a live market quote.

Theoretical scenarios are not predictions or actual portfolio profit/loss.

## 6. Implemented Agents

### Technical Agent
Analyses:
- Price relative to SMA50.
- RSI.
- MACD and its signal line.

### Options Agent
Analyses:
- Black-Scholes call and put prices.
- Delta.
- Theta per day.
- Historical volatility.
- Five option-price scenarios.

### Risk Scenario Agent
Analyses:
- Largest downside and upside scenarios.
- Call-price behaviour.
- Put-price behaviour.
- Scenario-related warnings.

### Market Risk Agent
Analyses the broader benchmark, currently NIFTY 50 (`^NSEI`):
- Benchmark price relative to SMA50.
- RSI.
- MACD.

### Synthesis Agent
Combines the four analytical agents:
- Identifies positive findings.
- Identifies negative findings.
- Identifies risk-related observations.
- Produces a rule-based overall interpretation.

Signal counts are not probabilities.

The current implementation has five agents in total: four analytical agents and one synthesis agent.

## 7. Gemini Integration

Library:
`@google/genai`

Files:
- `server/ai.js`
- `server/index.js`

Environment configuration:

`server/.env`

Expected variables:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Never commit `.env` or expose API keys.

Gemini returns structured JSON:

```json
{
  "summary": "...",
  "outlook": "..."
}
```

Gemini is instructed to:
- Interpret supplied calculations.
- Explain conflicting signals.
- Explain option Greeks and scenarios.
- Distinguish historical data from theoretical model outputs.
- Avoid unsupported predictions.
- Avoid personalised buy/sell recommendations.
- Avoid inventing missing values.

Temporary Gemini 503 capacity errors have occurred. A successful end-to-end request was subsequently verified.

## 8. Verified API Routes

Express:

- `GET /api/health`
- `GET /api/analytics-health`
- `GET /api/stock/:ticker`
- `GET /api/trend/:ticker`
- `GET /api/options/:ticker`
- `POST /api/explain`
- `POST /api/agents/run`
- `POST /api/analyze`

The combined endpoint `/api/analyze`:

1. Validates stock and option inputs.
2. Runs all five agents.
3. Passes the complete analysis object to Gemini.
4. Returns analytical results and AI explanation.
5. Preserves analytical results if Gemini fails.

Example request:

```json
{
  "ticker": "RELIANCE.NS",
  "strike": 1300,
  "days": 30,
  "rate": 0.05
}
```

## 9. Verified End-to-End Test

Tested successfully on 10 November 2026.

Ticker: `RELIANCE.NS`

Benchmark: `^NSEI`

Inputs:
- Strike: 1300
- Days to expiry: 30
- Risk-free rate: 0.05

Verified:
- Express started successfully.
- Flask analytics started successfully.
- Stock data retrieval worked.
- Technical indicators worked.
- Black-Scholes calculations worked.
- All five agents completed.
- Synthesis returned findings.
- Gemini generated a structured explanation.
- `/api/analyze` returned `aiStatus: completed`.

The successful response contained:

```json
{
  "overallStatus": "complete",
  "aiStatus": "completed",
  "aiError": null
}
```

This confirms that the local backend pipeline works for the tested request.

It does not establish predictive accuracy or research effectiveness.

## 10. Research Objectives

The research question defined in the synopsis is:

Does combining source-grounded financial news analysis with independently calculated technical and options-risk indicators and structured agents make an AI risk assessment more reliable than a single-LLM system or a quantitative-only system?

Research questions:

- RQ1: Does event-aware, dated financial news improve risk assessment?
- RQ2: Does structured multi-agent analysis improve evidence support and risk identification compared with a single LLM?
- RQ3: Can the system identify conflicting signals and produce uncertainty assessments that correspond to historical reliability?

These are hypotheses, not established findings.

## 11. Research and Evaluation Work Still Pending

The following are not yet implemented or experimentally established:

- Fundamentals Agent.
- News and Event Intelligence Agent.
- Dated and source-linked news retrieval.
- Evidence-grounded news analysis.
- Historical backtesting engine.
- S0–S4 benchmark runner and experiments.
- Chronological train, validation and test evaluation.
- Historical option-chain data.
- Implied volatility and open-interest analysis.
- Gamma, Vega and Rho.
- Confidence calibration.
- Evidence-support evaluation.
- Ablation studies.
- Statistical comparison of system variants.
- Final experimental results.

The research report and presentation contain proposed methodology and benchmark designs. Do not report proposed experiments as completed results.

## 12. Planned S0–S4 Benchmark

- S0: Quantitative-only.
- S1: Single LLM with quantitative metrics.
- S2: Single LLM with quantitative metrics and dated news.
- S3: Structured multi-agent system.
- S4: Ablation studies removing individual components.

The variants must use identical historical cases and information constraints.

The synopsis proposes a five-session forward return:

R(t,5) = (P(t+5) - P(t)) / P(t)

Proposed labels:
- Bullish: greater than +1%.
- Neutral: between -1% and +1%.
- Bearish: less than -1%.

Prevent look-ahead bias and information leakage.

## 13. Next Development Priorities

1. Review and verify the existing implementation.
2. Build the historical backtesting engine.
3. Implement S0–S4 benchmarking.
4. Add source-grounded news/event intelligence.
5. Add fundamental analysis.
6. Improve risk and uncertainty evaluation.
7. Complete the React dashboard.
8. Run experiments and document results.

Research literature review and mathematical formula verification will be handled in a separate research workspace.

## 14. Development Rules

- Work one step at a time.
- Explain the purpose of each change.
- Use exact Windows CMD commands.
- Avoid unnecessary rewrites.
- Inspect existing code before suggesting modifications.
- Preserve the CommonJS structure in Express (`require`, `module.exports`).
- Python remains the source of truth for calculations.
- Gemini interprets supplied evidence only.
- Never expose API keys.
- Never claim experimental results that have not been measured.
- Explain technical concepts in beginner-friendly language.
- Keep `PROJECT_CONTEXT.md` and `PROGRESS.md` updated after significant milestones.