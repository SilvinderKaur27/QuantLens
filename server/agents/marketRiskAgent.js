const TREND_API_BASE =
  process.env.TREND_API_BASE || "http://localhost:5000";

async function runMarketRiskAgent(input = {}) {
  const benchmarkTicker =
    input.marketTicker || input.benchmarkTicker || "^NSEI";

  try {
    const response = await fetch(
      `${TREND_API_BASE}/api/trend/${encodeURIComponent(benchmarkTicker)}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      throw new Error(`Trend API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.trend ?? data.data ?? data;

    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Unexpected market trend response.");
    }

    const metrics = { benchmark: benchmarkTicker };
    const findings = [];
    const warnings = [];

    const getNumber = (...keys) => {
      const key = keys.find(
        candidate =>
          result[candidate] !== undefined &&
          result[candidate] !== null &&
          result[candidate] !== ""
      );

      if (!key) return undefined;

      const value = Number(result[key]);
      return Number.isFinite(value) ? value : undefined;
    };

    metrics.currentPrice = getNumber(
      "currentPrice", "current_price", "price", "close"
    );

    metrics.sma50 = getNumber("sma50", "sma_50", "SMA_50", "sma");
    metrics.rsi = getNumber("rsi", "RSI", "rsi14", "rsi_14");
    metrics.macd = getNumber("macd", "MACD");
    metrics.macdSignal = getNumber(
      "macdSignal", "macd_signal", "signal"
    );

    if (
      Number.isFinite(metrics.currentPrice) &&
      Number.isFinite(metrics.sma50)
    ) {
      findings.push(
        metrics.currentPrice > metrics.sma50
          ? "The benchmark is above its 50-period moving average, suggesting a positive broader market trend."
          : metrics.currentPrice < metrics.sma50
            ? "The benchmark is below its 50-period moving average, suggesting a weaker broader market trend."
            : "The benchmark is at its 50-period moving average."
      );
    }

    if (Number.isFinite(metrics.rsi)) {
      if (metrics.rsi > 70) {
        findings.push("The broader market RSI indicates potentially overbought conditions.");
      } else if (metrics.rsi < 30) {
        findings.push("The broader market RSI indicates potentially oversold conditions.");
      } else {
        findings.push("The broader market RSI is in the neutral range.");
      }
    }

    if (
      Number.isFinite(metrics.macd) &&
      Number.isFinite(metrics.macdSignal)
    ) {
      findings.push(
        metrics.macd > metrics.macdSignal
          ? "The benchmark MACD suggests positive momentum."
          : metrics.macd < metrics.macdSignal
            ? "The benchmark MACD suggests negative momentum."
            : "The benchmark MACD is equal to its signal line."
      );
    }

    if (findings.length === 0) {
      warnings.push("No usable benchmark indicators were returned.");
    }

    return {
      agentName: "marketRisk",
      status: findings.length > 0 ? "completed" : "failed",
      benchmarkTicker,
      findings,
      metrics,
      warnings,
      source: "existing trend API",
    };

  } catch (error) {
    return {
      agentName: "marketRisk",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: [error.message || "Market-risk analysis failed."],
    };
  }
}

module.exports = { runMarketRiskAgent };