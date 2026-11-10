const OPTIONS_API_BASE =
  process.env.OPTIONS_API_BASE || "http://localhost:5000";

async function runOptionsAgent(input = {}) {
  const ticker = input.ticker;

  if (typeof ticker !== "string" || !ticker.trim()) {
    return {
      agentName: "options",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: ["A valid ticker symbol is required."],
    };
  }

  try {
    // Forward optional parameters to the existing Express endpoint.
    const params = new URLSearchParams();

    if (input.strike != null) {
      params.set("strike", String(input.strike));
    }

    if (input.days != null) {
      params.set("days", String(input.days));
    }

    if (input.rate != null) {
      params.set("rate", String(input.rate));
    }

    const query = params.toString();
    const url =
      `${OPTIONS_API_BASE}/api/options/${encodeURIComponent(ticker.trim())}` +
      (query ? `?${query}` : "");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`Options API returned HTTP ${response.status}`);
    }

    const data = await response.json();

    // Match the response structure confirmed from your existing API.
    const call = data.call;
    const put = data.put;
    const assumptions = data.assumptions;
    const scenarios = data.scenarios;

    if (
      !call ||
      !put ||
      !Number.isFinite(Number(call.price)) ||
      !Number.isFinite(Number(put.price))
    ) {
      throw new Error(
        "Options API response is missing valid call or put prices."
      );
    }

    const metrics = {
      spot: Number(data.inputs?.spot),
      strike: Number(data.inputs?.strike),
      callPrice: Number(call.price),
      putPrice: Number(put.price),
      callDelta: Number(call.delta),
      putDelta: Number(put.delta),
      callThetaPerDay: Number(call.theta_per_day),
      putThetaPerDay: Number(put.theta_per_day),
      daysToExpiry: Number(assumptions?.days_to_expiry),
      volatility: Number(assumptions?.volatility),
      riskFreeRate: Number(assumptions?.risk_free_rate),
    };

    // Remove unavailable values instead of reporting NaN.
    for (const [key, value] of Object.entries(metrics)) {
      if (!Number.isFinite(value)) {
        delete metrics[key];
      }
    }

    const findings = [];
    const warnings = [];

    const spot = metrics.spot;
    const strike = metrics.strike;

    if (Number.isFinite(spot) && Number.isFinite(strike)) {
      if (spot > strike) {
        findings.push("The call is in the money and the put is out of the money.");
      } else if (spot < strike) {
        findings.push("The call is out of the money and the put is in the money.");
      } else {
        findings.push("The call and put are at the money.");
      }
    }

    findings.push(
      `Modelled call price: ${metrics.callPrice}.`,
      `Modelled put price: ${metrics.putPrice}.`
    );

    if (Number.isFinite(metrics.callDelta)) {
      findings.push(
        `Call delta is ${metrics.callDelta}; it estimates the call price's sensitivity to a small change in the underlying price.`
      );
    }

    if (Number.isFinite(metrics.putDelta)) {
      findings.push(
        `Put delta is ${metrics.putDelta}; it estimates the put price's sensitivity to a small change in the underlying price.`
      );
    }

    if (
      Number.isFinite(metrics.callThetaPerDay) &&
      Number.isFinite(metrics.putThetaPerDay)
    ) {
      findings.push(
        "Daily theta values are reported using the existing API's convention."
      );

      if (metrics.putThetaPerDay > 0) {
        warnings.push(
          "Put daily theta is positive. Verify the API's theta sign convention before interpreting it as time decay."
        );
      }
    }

    if (Array.isArray(scenarios)) {
      metrics.scenarioCount = scenarios.length;

      const validScenarios = scenarios.filter(
        (scenario) =>
          Number.isFinite(Number(scenario.scenario_spot)) &&
          scenario.call &&
          scenario.put &&
          Number.isFinite(Number(scenario.call.price)) &&
          Number.isFinite(Number(scenario.put.price))
      );

      if (validScenarios.length > 0) {
        const lowestSpot = validScenarios[0];
        const highestSpot = validScenarios[validScenarios.length - 1];

        findings.push(
          `The supplied scenario table contains ${validScenarios.length} valid stock-price scenarios.`
        );

        if (
          Number(highestSpot.scenario_spot) >
          Number(lowestSpot.scenario_spot)
        ) {
          findings.push(
            `Across the supplied scenarios, call price changes from ${lowestSpot.call.price} to ${highestSpot.call.price}, while put price changes from ${lowestSpot.put.price} to ${highestSpot.put.price}.`
          );
        }
      } else {
        warnings.push("No valid option scenarios were found in the response.");
      }
    } else {
      warnings.push("The API did not return a scenarios array.");
    }

    if (assumptions?.volatility_source) {
      findings.push(
        `Volatility source: ${assumptions.volatility_source}.`
      );
    }

    if (data.price_source) {
      warnings.push(String(data.price_source));
    }

    return {
      agentName: "options",
      status: "completed",
      ticker: data.ticker || ticker.trim().toUpperCase(),
      model: data.model || "Black-Scholes",
      exerciseStyle: data.exercise_style || "unspecified",
      findings,
      metrics,
      scenarios: Array.isArray(scenarios) ? scenarios : [],
      assumptions: assumptions || {},
      warnings,
    };
  } catch (error) {
    return {
      agentName: "options",
      status: "failed",
      ticker: ticker.trim().toUpperCase(),
      findings: [],
      metrics: {},
      warnings: [error.message || "Options analysis failed."],
    };
  }
}

module.exports = { runOptionsAgent };