const { runTechnicalAgent } = require("../agents/technicalAgent");
const { runOptionsAgent } = require("../agents/optionsAgent");

async function runAnalysis(input = {}) {
  const agentTasks = [
    runTechnicalAgent(input),
    runOptionsAgent(input),
  ];

  const settledResults = await Promise.allSettled(agentTasks);

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