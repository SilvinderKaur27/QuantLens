# QuantLens — Development Progress

Last updated: 10 November 2026

## 1. Current Objective

Develop QuantLens into an AI-powered financial intelligence and options decision-support platform.

The platform analyses stocks through multiple dimensions using quantitative calculations, specialised agents and AI-generated explanations.

Core principle:

**Python calculates. Agents interpret. Express coordinates. React displays.**

The immediate objective is to complete the multi-agent analysis pipeline, integrate Gemini, connect the frontend and verify the complete application.

---

## 2. Environment Setup

### System

- OS: Windows
- Node.js: v26.13.0
- npm: v11.20.0
- Python 3.11 installed
- Python 3.12 virtual environment: `.venv312`
- Git: v2.54.0

### Project Location

```text
C:\Users\kaurs\Downloads\Prot-main (1)\Prot-main
```

### Completed

- [x] Extracted project repository.
- [x] Inspected project structure.
- [x] Installed client npm dependencies.
- [x] Installed server npm dependencies.
- [x] Set up Python virtual environments.
- [x] Installed Python dependencies in `.venv312`.
- [x] Configured Express development scripts.
- [x] Configured Flask analytics service.
- [x] Created a separate GitHub repository for QuantLens.
- [x] Added `.gitignore` to exclude virtual environments and environment secrets.
- [x] Added project documentation files.

### Important Environment Notes

- Use `.venv312` for the Flask analytics service because `pandas-ta` is installed there.
- Do not use the Python 3.11 `.venv` to run the Flask application.
- Express runs on port 5000.
- Flask runs on port 5001.
- React/Vite frontend runs on its development port, normally 5173.

---

## 3. Current Architecture

### Frontend
- React.js
- Vite

### Backend
- Node.js
- Express.js
- Google Gemini SDK (`@google/genai`)
- dotenv
- CORS

### Quantitative Analytics
- Python
- Flask
- yfinance
- pandas
- NumPy
- pandas-ta

### Architecture Flow

```text
React + Vite
     |
     v
Express Backend (Port 5000)
     |
     +------ Analysis Agents
     |          |
     |          v
     |     Agent Coordinator
     |          |
     |          v
     |     Synthesis Agent
     |
     +------ Gemini AI
     |
     v
Flask Analytics (Port 5001)
     |
     v
yfinance + Quantitative Calculations
```

---

## 4. Quantitative Backend — Completed

The Flask analytics service currently supports:

- [x] Stock price history.
- [x] SMA50.
- [x] RSI14.
- [x] MACD.
- [x] Historical volatility.
- [x] Black–Scholes European call pricing.
- [x] Black–Scholes European put pricing.
- [x] Delta calculation.
- [x] Theta per day.
- [x] Five underlying-price scenarios.

### API Verification

Successfully tested:

- [x] `/api/analytics-health`
- [x] `/api/stock/RELIANCE.NS`
- [x] `/api/trend/RELIANCE.NS`
- [x] `/api/options/RELIANCE.NS`

Express-to-Flask communication has been verified.

### Sample Options Results

Tested with:

- Ticker: RELIANCE.NS
- Strike: 1300
- Expiry: 30 days
- Risk-free rate: 0.05

Results included:

- Call price: 54.447014
- Put price: 24.715486
- Call Delta: 0.636983
- Put Delta: -0.363017
- Historical volatility: approximately 25.2%

Five stock-price scenarios were successfully generated.

These are theoretical model outputs, not guaranteed market prices.

---

## 5. Multi-Agent System — Completed

Five agents have now been implemented.

### Agent 1: Technical Agent

File:
`server/agents/technicalAgent.js`

Responsibilities:
- Retrieves technical trend data.
- Analyses SMA50.
- Analyses RSI.
- Analyses MACD.
- Identifies positive and negative momentum signals.

Status: COMPLETED AND TESTED.

### Agent 2: Options Agent

File:
`server/agents/optionsAgent.js`

Responsibilities:
- Retrieves Black–Scholes calculations.
- Analyses European call and put prices.
- Reports Delta and Theta.
- Reports historical volatility.
- Analyses five underlying-price scenarios.

Status: COMPLETED AND TESTED.

### Agent 3: Risk Scenario Agent

File:
`server/agents/riskScenarioAgent.js`

Responsibilities:
- Analyses upside and downside scenarios.
- Compares call and put prices under different stock-price movements.
- Identifies changes in theoretical option values.
- Communicates scenario limitations.

Status: IMPLEMENTED AND TESTED.

### Agent 4: Market Risk Agent

File:
`server/agents/marketRiskAgent.js`

Responsibilities:
- Analyses a broader market benchmark.
- Currently uses NIFTY 50 (`^NSEI`) by default.
- Examines SMA50, RSI and MACD.
- Identifies broader market momentum.
- Flags potentially overbought or oversold conditions.

Status: IMPLEMENTED AND TESTED.

### Agent 5: Synthesis Agent

File:
`server/agents/synthesisAgent.js`

Responsibilities:
- Collects findings from the four analysis agents.
- Identifies positive signals.
- Identifies negative signals.
- Identifies risk-related observations.
- Detects conflicting signals.
- Produces an overall interpretation.
- Returns supporting evidence.

Current implementation uses rule-based keyword classification.

Status: IMPLEMENTED AND TESTED.

---

## 6. Agent Orchestration — Completed

File:

`server/orchestrator/runAnalysis.js`

The coordinator currently:

1. Runs Technical and Options agents concurrently.
2. Passes Options Agent results to Risk Scenario Agent.
3. Runs Market Risk Agent using the supplied benchmark ticker.
4. Passes all four analysis-agent results to Synthesis Agent.
5. Collects results from all five agents.
6. Calculates the overall execution status.

### Successful API Test

Endpoint:

`POST /api/agents/run`

Test inputs:

```json
{
  "ticker": "RELIANCE.NS",
  "marketTicker": "^NSEI",
  "strike": 1300,
  "days": 30,
  "rate": 0.05
}
```

Response:

```text
overallStatus: complete

Technical: completed
Options: completed
Risk Scenario: completed
Market Risk: completed
Synthesis: completed
```

### Sample Synthesis Output

```text
Analysis completed by 4 agents.

4 positive signals were identified.

Overall interpretation:
Positive signals currently dominate.

2 risk-related observations require attention.
```

The synthesis also identified:
- Positive technical momentum.
- Positive broader market momentum.
- Potentially overbought NIFTY RSI.
- Downside scenario exposure.

**Important:** Signal counts are not probabilities of future market movements.

---

## 7. GitHub and Repository Management

- [x] Created separate QuantLens GitHub repository.
- [x] Configured Git remote.
- [x] Added `.gitignore`.
- [x] Prepared project documentation.
- [ ] Commit and push the latest five-agent implementation.
- [ ] Verify repository contains updated documentation.

Repository:

`https://github.com/SilvinderKaur27/QuantLens.git`

---

## 8. Current Limitations

The following features are not yet complete:

### AI Integration
- Gemini integration with all five agents needs to be completed and tested.
- AI explanations must use actual agent findings as evidence.
- Gemini failures must not break the quantitative analysis pipeline.

### Agent Intelligence
- Synthesis currently uses keyword-based classification.
- More advanced conflict detection is required.
- Evidence attribution can be improved.
- Agents currently depend primarily on existing technical and quantitative APIs.

### Financial Intelligence
- News and event intelligence.
- Fundamental analysis.
- Options chain integration.
- Implied volatility.
- Put-call ratio (PCR).
- Open interest analysis.
- Additional Greeks: Gamma, Vega and Rho.

### Evaluation
- Historical predictive backtesting is not complete.
- No verified predictive accuracy or calibration metrics exist.
- Benchmark evaluation methodology needs improvement.

### Product Features
- Persistent storage.
- User watchlists.
- Historical analysis.
- Evidence and news views.

---

## 9. Remaining Development Plan

### Phase 1 — Gemini Integration (NEXT PRIORITY)

- [ ] Inspect current `server/index.js`.
- [ ] Inspect current `server/ai.js`.
- [ ] Connect Gemini to the complete five-agent analysis.
- [ ] Supply agent findings and metrics as context.
- [ ] Generate a natural-language market explanation.
- [ ] Identify conflicting signals in the explanation.
- [ ] Ensure Gemini does not invent financial metrics.
- [ ] Test missing API key and API failure handling.

### Phase 2 — Frontend Integration

- [ ] Inspect current React dashboard.
- [ ] Connect all five agents to the frontend.
- [ ] Display individual agent findings.
- [ ] Display synthesis results.
- [ ] Display supporting evidence.
- [ ] Add loading states.
- [ ] Add API error handling.
- [ ] Verify complete user workflow.

### Phase 3 — Testing and Reliability

- [ ] Run existing Python tests.
- [ ] Add tests for all five agents.
- [ ] Add orchestrator tests.
- [ ] Test invalid ticker inputs.
- [ ] Test missing and incomplete API responses.
- [ ] Test Gemini failure handling.
- [ ] Test complete end-to-end workflow.

### Phase 4 — Improve Financial Intelligence

- [ ] Improve synthesis and conflict detection.
- [ ] Add news/event intelligence.
- [ ] Add fundamental analysis.
- [ ] Explore options chain and implied volatility.
- [ ] Add PCR and open interest.
- [ ] Implement additional Greeks.

### Phase 5 — Evaluation

- [ ] Audit existing benchmark implementation.
- [ ] Define prediction labels and evaluation windows.
- [ ] Prevent data leakage.
- [ ] Implement chronological backtesting.
- [ ] Evaluate model performance.
- [ ] Report actual measured results.

### Phase 6 — Finalisation

- [ ] Improve README.
- [ ] Update architecture documentation.
- [ ] Verify all environment variables.
- [ ] Run final integration tests.
- [ ] Commit and push all verified changes.

---

## 10. Development Rules

- Work on one task at a time.
- Use Windows CMD commands.
- Explain each action briefly and simply.
- Avoid large code changes without inspecting existing files.
- Preserve working implementations.
- Verify each change before moving forward.
- Do not claim predictive accuracy without backtesting.
- Do not describe heuristic signal scores as probabilities.
- Keep quantitative calculations separate from LLM-generated explanations.

---

## 11. Immediate Next Step

**Connect Gemini with the five-agent analysis pipeline.**

First inspect:

- `server/index.js`
- `server/ai.js`

Understand the existing `/api/explain` endpoint before changing it.

The desired flow:

```text
Four Analysis Agents
        |
        v
Synthesis Agent
        |
        v
Gemini AI
        |
        v
Final Financial Intelligence Report
        |
        v
React Dashboard
```

Current milestone:

**Five-agent analysis pipeline successfully implemented and tested.**