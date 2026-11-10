const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const API = process.env.API_BASE || "http://localhost:5000";
const TICKERS = ["RELIANCE.NS", "TCS.NS", "INFY.NS"];
const RUNS_PER_TICKER = 3;
const MARKET_TICKER = "^NSEI";
const RATE = 0.05;
const DAYS = 30;

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  return body;
}

function findNumber(object, keys) {
  for (const key of keys) {
    const value = Number(object?.[key]);
    if (object?.[key] !== undefined && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function scoreSingleLLM(result) {
  const output = result?.explanation ?? result;
  let score = 0;

  if (typeof output?.summary === "string" &&
      output.summary.trim().length > 0) score += 50;

  if (typeof output?.outlook === "string" &&
      output.outlook.trim().length > 0) score += 50;

  return score;
}

function scoreAgents(result) {
  const agents = result?.agents;
  if (!Array.isArray(agents) || agents.length === 0) return 0;

  let score = 0;
  const expected = ["technical", "options"];

  for (const name of expected) {
    const agent = agents.find(item => item.agentName === name);
    if (!agent) continue;

    if (agent.status === "completed") score += 25;
    if (Array.isArray(agent.findings) && agent.findings.length > 0) {
      score += 15;
    }
    if (agent.metrics && Object.keys(agent.metrics).length > 0) {
      score += 10;
    }
  }

  return score;
}

async function timedRun(system, ticker, run, task) {
  const started = performance.now();

  try {
    const result = await task();
    const latency = performance.now() - started;

    const completeness = system === "Single LLM"
      ? scoreSingleLLM(result)
      : scoreAgents(result);

    return {
      system,
      ticker,
      run,
      latency_ms: Number(latency.toFixed(2)),
      success: true,
      completeness_score: completeness,
      error: "",
      output: JSON.stringify(result),
    };
  } catch (error) {
    return {
      system,
      ticker,
      run,
      latency_ms: Number((performance.now() - started).toFixed(2)),
      success: false,
      completeness_score: 0,
      error: error.message,
      output: "",
    };
  }
}

async function benchmarkCase(ticker, run) {
  const encoded = encodeURIComponent(ticker);
  const market = encodeURIComponent(MARKET_TICKER);

  // Prepare shared quantitative inputs before timing either system.
  const [trendResponse, optionsResponse, marketResponse] = await Promise.all([
    request(`${API}/api/trend/${encoded}`),
    request(
      `${API}/api/stock/${encoded}`
    ),
    request(`${API}/api/trend/${market}`),
  ]);

  const trend = trendResponse?.trend ?? trendResponse?.data ?? trendResponse;
  const stock = optionsResponse?.stock ?? optionsResponse?.data ?? optionsResponse;

  const spot = findNumber(trend, [
    "currentPrice", "current_price", "price", "close"
  ]) ?? findNumber(stock, [
    "currentPrice", "current_price", "price", "latestPrice"
  ]);

  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error(`Could not determine a valid stock price for ${ticker}`);
  }

  const strike = Math.round(spot);
  const options = await request(
    `${API}/api/options/${encoded}?` +
    new URLSearchParams({
      strike: String(strike),
      days: String(DAYS),
      rate: String(RATE),
    })
  );

  const optionData = options?.options ?? options;
  const marketTrend =
    marketResponse?.trend ?? marketResponse?.data ?? marketResponse;

  const input = {
    ticker,
    trend,
    options: optionData,
    marketTicker: MARKET_TICKER,
    marketTrend,
  };

  // Alternate execution order to reduce simple order-related timing bias.
  const singleFirst = run % 2 === 1;

  const singleTask = () => request(`${API}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const agentTask = () => request(`${API}/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker,
      strike,
      days: DAYS,
      rate: RATE,
    }),
  });

  const tasks = singleFirst
    ? [
        timedRun("Single LLM", ticker, run, singleTask),
        timedRun("Two-agent prototype", ticker, run, agentTask),
      ]
    : [
        timedRun("Two-agent prototype", ticker, run, agentTask),
        timedRun("Single LLM", ticker, run, singleTask),
      ];

  return Promise.all(tasks);
}

function writeCsv(filePath, rows) {
  const columns = [
    "system", "ticker", "run", "latency_ms", "success",
    "completeness_score", "error", "output",
  ];

  const escape = value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    columns.join(","),
    ...rows.map(row => columns.map(key => escape(row[key])).join(",")),
  ].join("\n");

  fs.writeFileSync(filePath, csv, "utf8");
}

async function main() {
  const outputDir = path.join(__dirname, "results");
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (const ticker of TICKERS) {
    for (let run = 1; run <= RUNS_PER_TICKER; run++) {
      console.log(`Testing ${ticker}, run ${run}/${RUNS_PER_TICKER}`);

      try {
        results.push(...await benchmarkCase(ticker, run));
      } catch (error) {
        console.error(`${ticker}, run ${run}: ${error.message}`);
      }
    }
  }

  if (results.length === 0) {
    throw new Error("No benchmark results were produced.");
  }

  writeCsv(path.join(outputDir, "benchmark_results.csv"), results);

  fs.writeFileSync(
    path.join(outputDir, "benchmark_results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  console.table(results.map(row => ({
    system: row.system,
    ticker: row.ticker,
    run: row.run,
    latency_ms: row.latency_ms,
    success: row.success,
    completeness: row.completeness_score,
  })));

  console.log(`Saved ${results.length} results to ${outputDir}`);
}

main().catch(error => {
  console.error("Benchmark failed:", error.message);
  process.exitCode = 1;
});