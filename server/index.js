const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
const {askAI} = require("./ai");

app.use(cors({origin: "http://localhost:5173"}));
// app.use(express.json());
app.use(express.json({limit : '100kb'}));
const { runAnalysis } = require("./orchestrator/runAnalysis");

app.get("/api/health", (req, res) => {
    res.json({
        ok:true,
        service:"stock-helper-api"
    });
});

app.get("/api/analytics-health", async (req, res) => {
    try {
    const response = await fetch(
        "http://127.0.0.1:5001/health"
    );

    if (!response.ok) {
        throw new Error("Analytics service returned an error.");
    }
    const data = await response.json();
    res.json(data);
    } catch (error) {
    res.status(503).json({
        error: "Analytics service is not running."
    });
    }
});

app.get("/api/stock/:ticker", async (req, res) => {
    try {
        const ticker = req.params.ticker.trim().toUpperCase();
        if (!/^[A-Z0-9.^=-]{1,30}$/.test(ticker)) {
            return res.status(400).json({
                error: "invalid ticker format",
            });
        }
        const response = await fetch(`http://127.0.0.1:5001/prices?ticker=${encodeURIComponent(ticker)}`);
        const data = await response.json();
        if (!response.ok)
            return res.status(response.status).json(data);

        return res.json(data);
    } catch(error) {
        console.error("Stock API error:", error.message);
        return res.status(503).json({
            error: "Analytics service is not running."
        });
    }
});

app.get("/api/trend/:ticker", async (req, res) => {
    try {
        const ticker = req.params.ticker.trim().toUpperCase();
        if (!/^[A-Z0-9.^=-]{1,30}$/.test(ticker)) {
            return res.status(400).json({
                error: "Invalid ticker format",
            });
        }

        const response = await fetch(`http://127.0.0.1:5001/trend?ticker=${encodeURIComponent(ticker)}`);
        const data = await response.json();
        if (!response.ok)
            return res.status(response.status).json(data);
        return res.json(data);
    } catch(error) {
        console.error("Trend API error:", error.message);
        return res.status(503).json({
            error: "Analytics service is not running",
        });
    }
});

app.get("/api/options/:ticker", async (req, res) => {
    try {
        const ticker = req.params.ticker.trim().toUpperCase();
        if (!/^[A-Z0-9.^=-]{1,30}$/.test(ticker))
            return res.status(400).json({error: "Invalid ticker format."});

        const { strike, days, rate, volatility } = req.query;
        if (strike === undefined || days === undefined || rate === undefined)
            return res.status(400).json({error: "Provide strike, days and rate query parameters. Volatility is optional."});

        // const values = [strike, days, rate];
        const values = {strike, days, rate};
        if (volatility !== undefined) values.volatility = volatility;
        // if (values.some(value => typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value))))
        //     return res.status(400).json({error: "Option inputs must be valid numbers."});
        for (const [name, value] of Object.entries(values)) {
            if (typeof value !== "string" || value.trim() === "" || !Number.isFinite(Number(value)))
                return res.status(400).json({error: `Option inputs must be valid numbers. Error in ${name}.`});
        }

        const query = new URLSearchParams({
            ticker,
            ...values
        });
        const response = await fetch(`http://localhost:5001/options?${query.toString()}`);
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        return res.json(data);
    } catch(error) {
        console.error("Options API error:", error.message);
        res.status(503).json({error: "Unable to reach the analytics service."});
    }
});

app.post("/api/explain", async (req, res) => {
    try {
        const {
            ticker,
            analysis,
            confidenceOutlook
        } = req.body || {};

        // Validate ticker
        if (typeof ticker !== "string" || !ticker.trim()) {
            return res.status(400).json({
                error: "A valid stock ticker is required."
            });
        }

        // Validate five-agent analysis
        if (
            !analysis ||
            typeof analysis !== "object" ||
            !Array.isArray(analysis.agents)
        ) {
            return res.status(400).json({
                error: "Provide the complete five-agent analysis results."
            });
        }

        // Prepare data for Gemini
        const numbers = {
            ticker: ticker.trim().toUpperCase(),

            overallStatus: analysis.overallStatus,

            agents: analysis.agents,

            confidenceOutlook:
                confidenceOutlook &&
                typeof confidenceOutlook === "object"
                    ? confidenceOutlook
                    : null
        };

        // Generate AI explanation
        const explanation = await askAI(numbers);

        return res.json({
            ticker: numbers.ticker,
            explanation
        });

    } catch (error) {
        console.error("AI explanation error:", error.message);

        return res.status(502).json({
            error: "Unable to generate an AI explanation."
        });
    }
});

app.post("/api/agents/run", async (req, res) => {
  try {
    const { ticker, strike, days, rate } = req.body || {};

    if (typeof ticker !== "string" || !ticker.trim()) {
      return res.status(400).json({
        error: "A stock ticker is required.",
      });
    }

    const numericInputs = { strike, days, rate };

    for (const [name, value] of Object.entries(numericInputs)) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isFinite(Number(value))
      ) {
        return res.status(400).json({
          error: `A valid numeric ${name} is required.`,
        });
      }
    }

    if (Number(strike) <= 0 || Number(days) <= 0) {
      return res.status(400).json({
        error: "Strike and days must be positive numbers.",
      });
    }

    const result = await runAnalysis({
      ticker: ticker.trim().toUpperCase(),
      strike: Number(strike),
      days: Number(days),
      rate: Number(rate),
    });

    return res.json(result);
  } catch (error) {
    console.error("Agent analysis error:", error.message);

    return res.status(500).json({
      error: "Unable to run the agent analysis.",
    });
  }
});

app.listen(PORT, () => {
    console.log(`Express server is running at http://localhost:${PORT}.`);
});