async function runSynthesisAgent(input = {}) {
  const agents = input.agents || [];

  if (!Array.isArray(agents) || agents.length === 0) {
    return {
      agentName: "synthesis",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: ["No agent results were supplied for synthesis."],
    };
  }

  const completedAgents = agents.filter(
    agent => agent.status === "completed"
  );

  if (completedAgents.length === 0) {
    return {
      agentName: "synthesis",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: ["No agents completed successfully."],
    };
  }

  const allFindings = completedAgents.flatMap(
    agent => agent.findings || []
  );

  const bullishSignals = [];
  const bearishSignals = [];
  const riskSignals = [];

  for (const finding of allFindings) {
    const text = finding.toLowerCase();

    if (
      text.includes("positive momentum") ||
      text.includes("above its 50-period") ||
      text.includes("above the 50-period") ||
      text.includes("bullish")
    ) {
      bullishSignals.push(finding);
    }

    if (
      text.includes("negative momentum") ||
      text.includes("below its 50-period") ||
      text.includes("below the 50-period") ||
      text.includes("bearish")
    ) {
      bearishSignals.push(finding);
    }

    if (
      text.includes("overbought") ||
      text.includes("oversold") ||
      text.includes("downside") ||
      text.includes("risk")
    ) {
      riskSignals.push(finding);
    }
  }

  const findings = [];

  findings.push(
    `Analysis completed by ${completedAgents.length} agents.`
  );

  if (bullishSignals.length > 0) {
    findings.push(
      `${bullishSignals.length} positive signals were identified.`
    );
  }

  if (bearishSignals.length > 0) {
    findings.push(
      `${bearishSignals.length} negative signals were identified.`
    );
  }

  if (bullishSignals.length > bearishSignals.length) {
    findings.push(
      "Overall interpretation: positive signals currently dominate."
    );
  } else if (bearishSignals.length > bullishSignals.length) {
    findings.push(
      "Overall interpretation: negative signals currently dominate."
    );
  } else {
    findings.push(
      "Overall interpretation: signals are mixed or neutral."
    );
  }

  if (riskSignals.length > 0) {
    findings.push(
      `${riskSignals.length} risk-related observations require attention.`
    );
  }

  if (bullishSignals.length > 0 && bearishSignals.length > 0) {
    findings.push(
      "Conflicting market signals are present. Further investigation is recommended."
    );
  }

  return {
    agentName: "synthesis",
    status: "completed",
    findings,
    metrics: {
      agentsAnalyzed: completedAgents.length,
      bullishSignals: bullishSignals.length,
      bearishSignals: bearishSignals.length,
      riskSignals: riskSignals.length,
    },
    supportingEvidence: {
      bullish: bullishSignals,
      bearish: bearishSignals,
      risks: riskSignals,
    },
    warnings: [
      "This is a rule-based interpretation, not a prediction.",
      "Signal counts do not represent probabilities of market movement.",
    ],
  };
}

module.exports = { runSynthesisAgent };