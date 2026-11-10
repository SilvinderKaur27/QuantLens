const TREND_API_BASE =
  process.env.TREND_API_BASE || "http://localhost:5000";

async function runTechnicalAgent(input = {}) {
  const ticker = input.ticker;

  if (!ticker || typeof ticker !== "string") {
    return {
      agentName: "technical",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: ["A valid ticker symbol is required."],
    };
  }

  try {
    const response = await fetch(
      `${TREND_API_BASE}/api/trend/${encodeURIComponent(ticker.trim())}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      throw new Error(`Trend API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    const result = data.trend ?? data.data ?? data;

    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Trend API returned an unexpected response.");
    }

    const metrics = {};
    const findings = [];
    const warnings = [];

    const aliases = {
      currentPrice: ["currentPrice", "current_price", "price", "close"],
      sma50: ["sma50", "sma_50", "SMA_50", "sma"],
      rsi: ["rsi", "RSI", "rsi14", "rsi_14"],
      macd: ["macd", "MACD"],
      macdSignal: ["macdSignal", "macd_signal", "signal"],
      macdHistogram: ["macdHistogram", "macd_histogram", "histogram"],
    };

    for (const [metricName, keys] of Object.entries(aliases)) {
      const key = keys.find(
        (candidate) =>
          result[candidate] !== undefined &&
          result[candidate] !== null &&
          result[candidate] !== ""
      );

      if (key !== undefined) {
        const value = result[key];

        if (typeof value === "number" && Number.isFinite(value)) {
          metrics[metricName] = value;
        } else if (
          typeof value === "string" &&
          value.trim() !== "" &&
          Number.isFinite(Number(value))
        ) {
          metrics[metricName] = Number(value);
        } else {
          warnings.push(`Could not interpret ${metricName} as a number.`);
        }
      }
    }

    const trendLabel =
      result.trend ??
      result.trendLabel ??
      result.trend_label ??
      result.classification;

    if (typeof trendLabel === "string" && trendLabel.trim()) {
      findings.push(`Trend API classification: ${trendLabel.trim()}.`);
    }

    if (
      Number.isFinite(metrics.currentPrice) &&
      Number.isFinite(metrics.sma50)
    ) {
      if (metrics.currentPrice > metrics.sma50) {
        findings.push("Price is above the 50-period simple moving average.");
      } else if (metrics.currentPrice < metrics.sma50) {
        findings.push("Price is below the 50-period simple moving average.");
      } else {
        findings.push("Price is equal to the 50-period simple moving average.");
      }
    }

    if (Number.isFinite(metrics.rsi)) {
      if (metrics.rsi > 70) {
        findings.push("RSI is above 70, indicating potentially overbought conditions.");
      } else if (metrics.rsi < 30) {
        findings.push("RSI is below 30, indicating potentially oversold conditions.");
      } else {
        findings.push("RSI is between 30 and 70.");
      }
    }

    if (
      Number.isFinite(metrics.macd) &&
      Number.isFinite(metrics.macdSignal)
    ) {
      if (metrics.macd > metrics.macdSignal) {
        findings.push("MACD is above its signal line, suggesting positive momentum.");
      } else if (metrics.macd < metrics.macdSignal) {
        findings.push("MACD is below its signal line, suggesting negative momentum.");
      } else {
        findings.push("MACD is equal to its signal line.");
      }
    }

    if (findings.length === 0) {
      warnings.push(
        "The endpoint responded, but no recognized trend classification or usable indicators were found."
      );
    }

    return {
      agentName: "technical",
      status: "completed",
      ticker: ticker.trim().toUpperCase(),
      findings,
      metrics,
      warnings,
      source: "existing trend API",
    };
  } catch (error) {
    return {
      agentName: "technical",
      status: "failed",
      ticker: ticker.trim().toUpperCase(),
      findings: [],
      metrics: {},
      warnings: [error.message || "Technical analysis request failed."],
    };
  }
}

module.exports = { runTechnicalAgent };