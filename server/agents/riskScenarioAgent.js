async function runRiskScenarioAgent(input = {}) {
    const options = input.options || input.optionsResult || input;

    const scenarios = options.scenarios;

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
        return {
            agentName: "riskScenario",
            status: "failed",
            findings: [],
            metrics: {},
            warnings: ["No valid option scenarios were supplied."]
        };
    }

    const validScenarios = scenarios.filter(
        scenario =>
            Number.isFinite(scenario.scenario_spot) &&
            Number.isFinite(scenario.stock_change_percent) &&
            Number.isFinite(scenario.call?.price) &&
            Number.isFinite(scenario.put?.price)
    );

    if (validScenarios.length === 0) {
        return {
            agentName: "riskScenario",
            status: "failed",
            findings: [],
            metrics: {},
            warnings: ["Scenario data is incomplete or invalid."]
        };
    }

    const downside = validScenarios.filter(
        s => s.stock_change_percent < 0
    );

    const upside = validScenarios.filter(
        s => s.stock_change_percent > 0
    );

    const findings = [];

    if (downside.length > 0) {
        const worstDownside = downside.reduce(
            (a, b) => a.stock_change_percent < b.stock_change_percent ? a : b
        );

        findings.push(
            `In the largest downside scenario (${worstDownside.stock_change_percent}%), the call price is ${worstDownside.call.price} and the put price is ${worstDownside.put.price}.`
        );
    }

    if (upside.length > 0) {
        const largestUpside = upside.reduce(
            (a, b) => a.stock_change_percent > b.stock_change_percent ? a : b
        );

        findings.push(
            `In the largest upside scenario (${largestUpside.stock_change_percent}%), the call price is ${largestUpside.call.price} and the put price is ${largestUpside.put.price}.`
        );
    }

    const first = validScenarios[0];
    const last = validScenarios[validScenarios.length - 1];

    if (last.call.price > first.call.price) {
        findings.push("Call prices increase as the underlying stock price rises across the supplied scenarios.");
    }

    if (last.put.price < first.put.price) {
        findings.push("Put prices decrease as the underlying stock price rises across the supplied scenarios.");
    }

    return {
        agentName: "riskScenario",
        status: "completed",
        findings,
        metrics: {
            scenariosAnalyzed: validScenarios.length,
            downsideScenarios: downside.length,
            upsideScenarios: upside.length,
            lowestScenarioSpot: Math.min(...validScenarios.map(s => s.scenario_spot)),
            highestScenarioSpot: Math.max(...validScenarios.map(s => s.scenario_spot))
        },
        warnings: [
            "These are theoretical Black-Scholes scenarios, not predictions.",
            "They do not represent actual portfolio profit or loss."
        ]
    };
}

module.exports = { runRiskScenarioAgent };