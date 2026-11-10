const { runTechnicalAgent } = require("../agents/technicalAgent");
const { runOptionsAgent } = require("../agents/optionsAgent");
const { runRiskScenarioAgent } = require("../agents/riskScenarioAgent");
const { runMarketRiskAgent } = require("../agents/marketRiskAgent");
const { runSynthesisAgent } = require("../agents/synthesisAgent");

async function runAnalysis(input = {}) {
  // 1. Run Technical and Options agents.
  const settledResults = await Promise.allSettled([
    runTechnicalAgent(input),
    runOptionsAgent(input),
  ]);

  const agentNames = ["technical", "options"];

  const agents = settledResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      agentName: agentNames[index],
      status: "failed",
      findings: [],
      metrics: {},
      warnings: [
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown agent error.",
      ],
    };
  });

  // 2. Run Risk Scenario Agent.
  const optionsAgent = agents.find(
    (agent) => agent.agentName === "options"
  );

  try {
    const riskResult = await runRiskScenarioAgent({
      options: optionsAgent,
    });
    agents.push(riskResult);
  } catch (error) {
    agents.push({
      agentName: "riskScenario",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: [error.message || "Unknown agent error."],
    });
  }

  // 3. Run Market Risk Agent.
  try {
    const marketRiskResult = await runMarketRiskAgent(input);
    agents.push(marketRiskResult);
  } catch (error) {
    agents.push({
      agentName: "marketRisk",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: [error.message || "Unknown agent error."],
    });
  }

  // 4. Combine findings using Synthesis Agent.
  try {
    const synthesisResult = await runSynthesisAgent({ agents });
    agents.push(synthesisResult);
  } catch (error) {
    agents.push({
      agentName: "synthesis",
      status: "failed",
      findings: [],
      metrics: {},
      warnings: [error.message || "Synthesis failed."],
    });
  }

  // 5. Calculate overall status.
  const completedCount = agents.filter(
    (agent) => agent.status === "completed"
  ).length;

  const failedCount = agents.filter(
    (agent) => agent.status === "failed"
  ).length;

  let overallStatus = "complete";

  if (failedCount > 0) {
    overallStatus = completedCount > 0 ? "partial" : "failed";
  }

  return {
    overallStatus,
    agents,
  };
}

module.exports = { runAnalysis };