import { useState } from "react";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DEFAULT_TICKER = "RELIANCE.NS";
const DEFAULT_MARKET_TICKER = "^NSEI";

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);

  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(
      body.error || body.message || `Request failed (${response.status})`
    );
  }

  return body;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  const number = numberOrNull(value);
  return number === null
    ? "—"
    : number.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
}

function formatPrice(value) {
  const number = numberOrNull(value);
  return number === null
    ? "—"
    : number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function pick(object, keys) {
  for (const key of keys) {
    if (object?.[key] !== undefined && object[key] !== null) {
      return object[key];
    }
  }
  return null;
}

function unwrapTrend(raw) {
  return raw?.trend ?? raw?.data ?? raw ?? {};
}

function unwrapStock(raw) {
  return raw?.stock ?? raw?.data ?? raw ?? {};
}

function getLatestPrice(stock) {
  const direct = pick(stock, [
    "currentPrice",
    "current_price",
    "price",
    "latestPrice",
    "latest_price",
    "lastClose",
  ]);

  if (numberOrNull(direct) !== null) return numberOrNull(direct);

  const rows = getPriceRows(stock);
  const last = rows[rows.length - 1];

  return numberOrNull(
    pick(last, ["Close", "close", "price", "adjClose", "adj_close"])
  );
}

function getPriceRows(stock) {
  const candidate =
    stock?.history ??
    stock?.prices ??
    stock?.data ??
    stock?.results ??
    [];

  if (Array.isArray(candidate)) return candidate;
  if (Array.isArray(candidate?.history)) return candidate.history;
  if (Array.isArray(candidate?.prices)) return candidate.prices;

  return [];
}

function getIndicator(trend, keys) {
  return numberOrNull(pick(trend, keys));
}

function getMacdDirection(trend) {
  const label = String(
    pick(trend, [
      "macdSignal",
      "macd_signal_label",
      "macdTrend",
      "macd_trend",
    ]) ?? ""
  ).toLowerCase();

  if (label.includes("bull")) return "bullish";
  if (label.includes("bear")) return "bearish";

  const histogram = getIndicator(trend, [
    "macdHistogram",
    "macd_histogram",
    "histogram",
    "macd_hist",
  ]);

  if (histogram !== null) {
    if (histogram > 0) return "bullish";
    if (histogram < 0) return "bearish";
  }

  const macd = getIndicator(trend, ["macd", "macdLine", "macd_line"]);
  const signal = getIndicator(trend, [
    "macdSignalLine",
    "macd_signal_line",
    "signalLine",
    "signal_line",
  ]);

  if (macd !== null && signal !== null) {
    if (macd > signal) return "bullish";
    if (macd < signal) return "bearish";
  }

  return null;
}

/*
 * Initial Confidence Outlook rules:
 * - Price above/below SMA50 provides one signal.
 * - RSI >= 55 / <= 45 provides one signal.
 * - MACD above/below its signal line, or histogram sign, provides one signal.
 * - At least two available signals must agree on a direction.
 * - Otherwise show Neutral.
 *
 * This is a directional classification, not a probability or confidence score.
 */
function classifyOutlook(rawTrend) {
  const trend = unwrapTrend(rawTrend);
  // Each indicator contributes at most one vote.
  const signals = [];

  const price = getIndicator(trend, [
    "price",
    "currentPrice",
    "current_price",
    "close",
    "latestPrice",
  ]);

  const sma50 = getIndicator(trend, [
    "sma50",
    "sma_50",
    "SMA50",
    "sma",
  ]);

  const rsi = getIndicator(trend, [
    "rsi",
    "rsi14",
    "rsi_14",
    "RSI",
  ]);

  const macdDirection = getMacdDirection(trend);

  // Signal 1: price compared with SMA (50).
  if (price !== null && sma50 !== null) {
    if (price > sma50) signals.push("bullish");
    else if (price < sma50) signals.push("bearish");
    else signals.push("neutral");
  }

  // Signal 2: RSI (14). The 45–55 band is treated as neutral.
  if (rsi !== null && rsi >= 0 && rsi <= 100) {
    if (rsi >= 55) signals.push("bullish");
    else if (rsi <= 45) signals.push("bearish");
    else signals.push("neutral");
  }

  // Signal 3: MACD direction.
  if (macdDirection) {
    signals.push(macdDirection);
  }

  const total = signals.length;
  const bullish = signals.filter((s) => s === "bullish").length;
  const bearish = signals.filter((s) => s === "bearish").length;
  const neutral = signals.filter((s) => s === "neutral").length;

  // Do not manufacture a score when fewer than two signals are available.
  if (total < 2) {
    return {
      label: "Neutral",
      score: null,
      signalsAvailable: total,
      signalsExpected: 3,
      detail: "Insufficient indicator data to classify the outlook reliably.",
    };
  }

  let label;
  let supportingSignals;

  if (bullish >= 2 && bullish > bearish) {
    label = "Bullish";
    supportingSignals = bullish;
  } else if (bearish >= 2 && bearish > bullish) {
    label = "Bearish";
    supportingSignals = bearish;
  } else {
    label = "Neutral";
  }

  /*
   * Heuristic alignment score, not a probability:
   *
   * Bullish/Bearish:
   *   supporting directional signals / 3 total possible signals.
   *
   * Neutral:
   *   neutral signals + balanced opposing bullish/bearish pairs,
   *   divided by 3 total possible signals.
   *
   * Dividing by 3 also accounts for missing indicators. Scores are
   * rounded to an integer from 0 to 100.
   */
  let rawScore;

  if (label === "Bullish" || label === "Bearish") {
    rawScore = (supportingSignals / 3) * 100;
  } else {
    const balancedOpposition = 2 * Math.min(bullish, bearish);
    rawScore = ((neutral + balancedOpposition) / 3) * 100;
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    label,
    score,
    signalsAvailable: total,
    signalsExpected: 3,
    detail:
      label === "Bullish"
        ? "Bullish indicator alignment."
        : label === "Bearish"
          ? "Bearish indicator alignment."
          : "The available indicators are mixed or neutral.",
  };
}

function MetricCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {note && <span className="metric-note">{note}</span>}
    </div>
  );
}

function OutlookCard({ title, ticker, outlook, loading }) {
  const label = outlook?.label || "Neutral";
  const className = label.toLowerCase();
  const score = Number.isFinite(outlook?.score) ? outlook.score : null;

  return (
    <section className={`outlook-card outlook-${className}`}>
      <div className="outlook-heading">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{ticker}</h3>
        </div>
        <span className="outlook-indicator" aria-hidden="true" />
      </div>

      <div className="outlook-result">
        {loading ? "Analyzing…" : label}
      </div>

      <div className="confidence-row">
        <span>Confidence score</span>
        <strong>
          {loading ? "—" : score === null ? "N/A" : `${score}/100`}
        </strong>
      </div>

      {score !== null && !loading && (
        <div
          className="confidence-track"
          role="progressbar"
          aria-label={`${title} alignment score`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
        >
          <div
            className="confidence-fill"
            style={{ width: `${score}%` }}
          />
        </div>
      )}

      <p className="muted">
        {loading
          ? "Fetching and evaluating indicator data."
          : outlook?.detail || "Run an analysis to view the outlook."}
      </p>

      <p className="confidence-disclaimer">
        Indicator-alignment score, not a probability of future price movement.
      </p>
    </section>
  );
}

function App() {
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [marketTicker, setMarketTicker] = useState(DEFAULT_MARKET_TICKER);
  const [strike, setStrike] = useState("1400");
  const [days, setDays] = useState("30");
  const [riskFreeRate, setRiskFreeRate] = useState("5");

  const [loading, setLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [agentResults, setAgentResults] = useState(null);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState("");

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");
    setAiError("");
    setAiExplanation(null);

    const cleanTicker = ticker.trim().toUpperCase();
    const cleanMarketTicker = marketTicker.trim().toUpperCase();
    const strikeValue = Number(strike);
    const daysValue = Number(days);
    const ratePercent = Number(riskFreeRate);

    if (!cleanTicker) {
      setError("Enter a stock ticker.");
      return;
    }

    if (!cleanMarketTicker) {
      setError("Enter a market benchmark ticker.");
      return;
    }

    if (!Number.isFinite(strikeValue) || strikeValue <= 0) {
      setError("Strike price must be a positive number.");
      return;
    }

    if (!Number.isFinite(daysValue) || daysValue <= 0) {
      setError("Days to expiry must be a positive number.");
      return;
    }

    if (
      riskFreeRate.trim() === "" ||
      !Number.isFinite(ratePercent) ||
      ratePercent < -100 ||
      ratePercent > 100
    ) {
      setError("Risk-free rate must be between -100% and 100%.");
      return;
    }

    setLoading(true);
    setHasResults(false);

    try {
      const encodedTicker = encodeURIComponent(cleanTicker);
      const encodedMarket = encodeURIComponent(cleanMarketTicker);

      const optionsQuery = new URLSearchParams({
        strike: String(strikeValue),
        days: String(daysValue),
        // Convert user-entered percentage to decimal: 5 -> 0.05
        rate: String(ratePercent / 100),
      });

      const [stockResponse, trendResponse, optionsResponse, marketResponse] =
        await Promise.all([
          fetchJSON(
            `${API_BASE}/api/stock/${encodedTicker}`
          ),
          fetchJSON(
            `${API_BASE}/api/trend/${encodedTicker}`
          ),
          fetchJSON(
            `${API_BASE}/api/options/${encodedTicker}?${optionsQuery.toString()}`
          ),
          fetchJSON(
            `${API_BASE}/api/trend/${encodedMarket}`
          ),
        ]);

      const stock = unwrapStock(stockResponse);
      const trend = unwrapTrend(trendResponse);
      const options = optionsResponse?.options ?? optionsResponse;
      const marketTrend = unwrapTrend(marketResponse);

      const result = {
        ticker: cleanTicker,
        marketTicker: cleanMarketTicker,
        stock,
        trend,
        options,
        marketTrend,
        ratePercent,
        strike: strikeValue,
        days: daysValue,
      };

      setData(result);
      setHasResults(true);

      // Run the two implemented agents using the same analysis inputs.
      setAgentsLoading(true);
      setAgentsError("");
      setAgentResults(null);

      try {
        const agentResponse = await fetchJSON(`${API_BASE}/api/agents/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: cleanTicker,
            strike: strikeValue,
            days: daysValue,
            // The API expects a decimal: 5% becomes 0.05.
            rate: ratePercent / 100,
          }),
        });

        setAgentResults(agentResponse);
      } catch (agentRequestError) {
        setAgentsError(
          agentRequestError.message || "Could not run the analysis agents."
        );
      } finally {
        setAgentsLoading(false);
      }

      // The existing Express endpoint expects top-level ticker, trend,
      // and options, with options.scenarios as an array.
      setAiLoading(true);

      try {
        const explanationResponse = await fetchJSON(
          `${API_BASE}/api/explain`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticker: cleanTicker,
              trend,
              options,
              marketTicker: cleanMarketTicker,
              marketTrend,
              confidenceOutlook: {
                stock: classifyOutlook(trend),
                market: classifyOutlook(marketTrend),
              },
            }),
          }
        );

        setAiExplanation(
          explanationResponse?.explanation ?? explanationResponse
        );
      } catch (aiRequestError) {
        setAiError(
          aiRequestError.message ||
            "The analysis loaded, but the AI explanation could not be generated."
        );
      } finally {
        setAiLoading(false);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not load the analysis. Check that Express and Flask are running."
      );
    } finally {
      setLoading(false);
    }
  }

  const trend = data?.trend ?? {};
  const options = data?.options ?? {};
  const call = options?.call ?? {};
  const put = options?.put ?? {};
  const scenarios = Array.isArray(options?.scenarios)
    ? options.scenarios
    : [];

  const stockOutlook = data ? classifyOutlook(trend) : null;
  const marketOutlook = data ? classifyOutlook(data.marketTrend) : null;

  const stockPrice =
    getLatestPrice(data?.stock ?? {}) ??
    getIndicator(trend, ["price", "currentPrice", "current_price", "close"]);

  const sma50 = getIndicator(trend, ["sma50", "sma_50", "SMA50", "sma"]);
  const rsi = getIndicator(trend, ["rsi", "rsi14", "rsi_14", "RSI"]);
  const macd = getIndicator(trend, ["macd", "macdLine", "macd_line"]);
  const macdSignalLine = getIndicator(trend, [
    "macdSignalLine",
    "macd_signal_line",
    "signalLine",
    "signal_line",
  ]);
  const macdHistogram = getIndicator(trend, [
    "macdHistogram",
    "macd_histogram",
    "histogram",
    "macd_hist",
  ]);

  const volatility = pick(options, [
    "volatility",
    "volatility_percent",
    "sigma",
  ]);

  const priceRows = getPriceRows(data?.stock ?? {}).slice(-5).reverse();

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="StockLens home">
          <span className="brand-mark">S</span>
          <span>StockLens</span>
        </a>
        <span className="topbar-label">Stock & Options Analysis</span>
      </header>

      <section className="hero">
        <p className="eyebrow">MARKET INTELLIGENCE WORKSPACE</p>
        <h1>Understand the numbers behind the market.</h1>
        <p className="hero-copy">
          Analyze technical indicators, theoretical option values, price
          scenarios, and the directional outlook for a stock and its broader
          market benchmark.
        </p>
      </section>

      <section className="panel input-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ANALYSIS CONFIGURATION</p>
            <h2>Set your inputs</h2>
          </div>
          <span className="live-tag">Backend connected on request</span>
        </div>

        <form onSubmit={handleAnalyze}>
          <div className="input-grid">
            <label className="field">
              <span>Stock ticker</span>
              <input
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
                placeholder="RELIANCE.NS"
                autoComplete="off"
                required
              />
            </label>

            <label className="field">
              <span>Market benchmark ticker</span>
              <input
                value={marketTicker}
                onChange={(event) => setMarketTicker(event.target.value)}
                placeholder="^NSEI"
                autoComplete="off"
                required
              />
            </label>

            <label className="field">
              <span>Option strike price</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={strike}
                onChange={(event) => setStrike(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Days to expiry</span>
              <input
                type="number"
                min="1"
                step="1"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Risk-free rate (%)</span>
              <input
                type="number"
                min="-100"
                max="100"
                step="0.1"
                value={riskFreeRate}
                onChange={(event) => setRiskFreeRate(event.target.value)}
                required
              />
              <small>
                Assumption, not a live market rate. Sent to the API as a
                decimal.
              </small>
            </label>
          </div>

          <div className="form-footer">
            <p className="muted">
              Example: 5% is sent as <code>0.05</code>.
            </p>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <div className="loading-panel" role="status">
          <span className="spinner" />
          Fetching stock data, indicators, options, and market benchmark…
        </div>
      )}

      {hasResults && data && (
        <>
          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PRIORITY FEATURE</p>
                <h2>Confidence Outlook</h2>
                <p className="muted">
                  Directional classifications only. No confidence score or
                  evidence breakdown is included in this version.
                </p>
              </div>
            </div>

            <div className="outlook-grid">
              <OutlookCard
                title="Individual stock outlook"
                ticker={data.ticker}
                outlook={stockOutlook}
                loading={loading}
              />
              <OutlookCard
                title="Broader market outlook"
                ticker={data.marketTicker}
                outlook={marketOutlook}
                loading={loading}
              />
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">UNDERLYING ASSET</p>
                <h2>{data.ticker} overview</h2>
              </div>
              <span className="muted">Latest price from available data</span>
            </div>

            <div className="metric-grid">
              <MetricCard
                label="Latest stock price"
                value={formatPrice(stockPrice)}
              />
              <MetricCard
                label="SMA (50)"
                value={formatPrice(sma50)}
                note={
                  stockPrice !== null && sma50 !== null
                    ? stockPrice > sma50
                      ? "Price above SMA"
                      : stockPrice < sma50
                        ? "Price below SMA"
                        : "Price equals SMA"
                    : "Not returned by API"
                }
              />
              <MetricCard
                label="RSI (14)"
                value={formatNumber(rsi)}
                note={
                  rsi === null
                    ? "Not returned by API"
                    : rsi >= 70
                      ? "Traditional overbought zone"
                      : rsi <= 30
                        ? "Traditional oversold zone"
                        : "Between 30 and 70"
                }
              />
              <MetricCard
                label="MACD"
                value={formatNumber(macd, 4)}
              />
              <MetricCard
                label="MACD signal line"
                value={formatNumber(macdSignalLine, 4)}
              />
              <MetricCard
                label="MACD histogram"
                value={formatNumber(macdHistogram, 4)}
              />
            </div>

            <div className="panel data-panel">
              <div className="section-heading compact-heading">
                <h3>Recent price history</h3>
                <span className="muted">Latest five rows returned by API</span>
              </div>

              {priceRows.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceRows.map((row, index) => (
                        <tr key={`${row.Date ?? row.date ?? index}`}>
                          <td>
                            {String(
                              row.Date ??
                                row.date ??
                                row.timestamp ??
                                "—"
                            ).slice(0, 10)}
                          </td>
                          <td>
                            {formatPrice(pick(row, ["Open", "open"]))}
                          </td>
                          <td>
                            {formatPrice(pick(row, ["High", "high"]))}
                          </td>
                          <td>
                            {formatPrice(pick(row, ["Low", "low"]))}
                          </td>
                          <td>
                            {formatPrice(
                              pick(row, ["Close", "close", "price"])
                            )}
                          </td>
                          <td>
                            {formatNumber(
                              pick(row, ["Volume", "volume"]),
                              0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">
                  The stock endpoint did not return a recognizable price-history
                  array. Other returned analysis is still displayed where
                  available.
                </p>
              )}
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">BLACK–SCHOLES MODEL</p>
                <h2>Option prices & Greeks</h2>
              </div>
              <span className="muted">
                Strike {formatPrice(data.strike)} · {data.days} days · Rate{" "}
                {formatNumber(data.ratePercent, 2)}%
              </span>
            </div>

            <div className="options-grid">
              <article className="option-card">
                <p className="eyebrow">CALL OPTION</p>
                <h3>{formatPrice(pick(call, ["price", "optionPrice"]))}</h3>
                <div className="option-detail">
                  <span>Delta</span>
                  <strong>{formatNumber(call.delta, 4)}</strong>
                </div>
                <div className="option-detail">
                  <span>Theta per day</span>
                  <strong>
                    {formatNumber(
                      pick(call, ["theta_per_day", "thetaPerDay", "theta"]),
                      5
                    )}
                  </strong>
                </div>
              </article>

              <article className="option-card">
                <p className="eyebrow">PUT OPTION</p>
                <h3>{formatPrice(pick(put, ["price", "optionPrice"]))}</h3>
                <div className="option-detail">
                  <span>Delta</span>
                  <strong>{formatNumber(put.delta, 4)}</strong>
                </div>
                <div className="option-detail">
                  <span>Theta per day</span>
                  <strong>
                    {formatNumber(
                      pick(put, ["theta_per_day", "thetaPerDay", "theta"]),
                      5
                    )}
                  </strong>
                </div>
              </article>
            </div>

            <div className="metric-grid">
              <MetricCard
                label="Volatility used"
                value={
                  numberOrNull(volatility) === null
                    ? "—"
                    : `${formatNumber(volatility, 2)}%`
                }
                note={
                  options?.price_source === "user"
                    ? "User-supplied override"
                    : options?.price_source === "historical"
                      ? "Historical volatility"
                      : "Source label depends on API response"
                }
              />
              <MetricCard
                label="Risk-free rate"
                value={`${formatNumber(data.ratePercent)}%`}
                note="User-configured assumption"
              />
              <MetricCard
                label="Strike price"
                value={formatPrice(data.strike)}
              />
              <MetricCard
                label="Expiry"
                value={`${data.days} days`}
              />
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">WHAT-IF ANALYSIS</p>
                <h2>Option price scenarios</h2>
                <p className="muted">
                  The underlying stock price changes while the other model
                  inputs are held constant.
                </p>
              </div>
            </div>

            <div className="panel table-panel">
              {scenarios.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Stock move</th>
                        <th>Scenario stock price</th>
                        <th>Call price</th>
                        <th>Put price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarios.map((scenario, index) => (
                        <tr
                          key={`${scenario.stock_change_percent ?? scenario.change_percent ?? index}`}
                        >
                          <td>
                            {formatNumber(
                              pick(scenario, [
                                "stock_change_percent",
                                "change_percent",
                                "changePercent",
                              ]),
                              0
                            )}
                            %
                          </td>
                          <td>
                            {formatPrice(
                              pick(scenario, [
                                "scenario_spot",
                                "scenarioSpot",
                                "stock_price",
                                "spot",
                              ])
                            )}
                          </td>
                          <td>
                            {formatPrice(
                              pick(scenario.call, ["price", "optionPrice"])
                            )}
                          </td>
                          <td>
                            {formatPrice(
                              pick(scenario.put, ["price", "optionPrice"])
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">
                  No scenario array was returned. Check the options API
                  response.
                </p>
              )}
            </div>
          </section>


          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MULTI-AGENT ANALYSIS</p>
                <h2>Agent findings</h2>
                <p className="muted">
                  Technical indicators and option calculations are handled by separate
                  agents. The results are generated from your selected inputs.
                </p>
              </div>
              {agentResults && (
                <span className="live-tag">
                  Status: {agentResults.overallStatus}
                </span>
              )}
            </div>

            {agentsLoading && (
              <div className="loading-panel" role="status">
                <span className="spinner" />
                Running Technical and Options agents…
              </div>
            )}

            {agentsError && (
              <div className="error-message" role="alert">
                {agentsError}
              </div>
            )}

            {agentResults?.agents && (
              <div className="agent-grid">
                {agentResults.agents.map((agent) => (
                  <article className="panel agent-card" key={agent.agentName}>
                    <div className="agent-card-heading">
                      <div>
                        <p className="eyebrow">AGENT</p>
                        <h3>
                          {agent.agentName === "technical"
                            ? "Technical Agent"
                            : agent.agentName === "options"
                              ? "Options Agent"
                              : agent.agentName}
                        </h3>
                      </div>
                      <span className={`agent-status status-${agent.status}`}>
                        {agent.status}
                      </span>
                    </div>

                    <h4>Findings</h4>
                    {agent.findings?.length ? (
                      <ul className="agent-list">
                        {agent.findings.map((finding, index) => (
                          <li key={`${agent.agentName}-finding-${index}`}>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No findings returned.</p>
                    )}

                    <h4>Metrics</h4>
                    {Object.keys(agent.metrics || {}).length ? (
                      <dl className="agent-metrics">
                        {Object.entries(agent.metrics).map(([key, value]) => (
                          <div key={key}>
                            <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                            <dd>
                              {typeof value === "number"
                                ? formatNumber(value, 4)
                                : String(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="muted">No metrics returned.</p>
                    )}

                    {agent.warnings?.length > 0 && (
                      <>
                        <h4>Notes and warnings</h4>
                        <ul className="agent-list agent-warnings">
                          {agent.warnings.map((warning, index) => (
                            <li key={`${agent.agentName}-warning-${index}`}>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

        
          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AI INTERPRETATION</p>
                <h2>Analysis summary</h2>
              </div>
            </div>

            <div className="panel ai-panel">
              {aiLoading && (
                <p className="muted">Generating an explanation from the latest results…</p>
              )}

              {aiError && (
                <div className="error-message" role="alert">
                  {aiError}
                </div>
              )}

              {aiExplanation && (
                <>
                  {aiExplanation.summary && (
                    <div className="ai-section">
                      <h3>Summary</h3>
                      <p>{aiExplanation.summary}</p>
                    </div>
                  )}
                  {aiExplanation.outlook && (
                    <div className="ai-section">
                      <h3>Outlook interpretation</h3>
                      <p>{aiExplanation.outlook}</p>
                    </div>
                  )}
                  {!aiExplanation.summary && !aiExplanation.outlook && (
                    <pre className="raw-response">
                      {JSON.stringify(aiExplanation, null, 2)}
                    </pre>
                  )}
                </>
              )}

              {!aiLoading && !aiError && !aiExplanation && (
                <p className="muted">
                  No AI explanation is available yet.
                </p>
              )}
            </div>
          </section>

          <footer className="disclaimer">
            <strong>Important:</strong> This dashboard provides indicator-based
            analysis and theoretical option values, not guaranteed forecasts or
            investment advice. Black–Scholes assumptions may differ from actual
            market conditions. The broader market outlook uses the selected
            benchmark ticker.
          </footer>
        </>
      )}

      {!hasResults && !loading && (
        <section className="empty-state">
          <div className="empty-icon">↗</div>
          <h2>Your analysis will appear here</h2>
          <p>
            Enter a stock ticker, benchmark, strike, expiry, and risk-free rate,
            then select Analyze.
          </p>
        </section>
      )}
    </main>
  );
}

export default App;