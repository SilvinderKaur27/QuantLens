import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

BASE = Path(__file__).parent
INPUT = BASE / "results" / "benchmark_results.csv"
OUTPUT = BASE / "results" / "benchmark_comparison.png"

df = pd.read_csv(INPUT)
df["success"] = df["success"].astype(str).str.lower().eq("true")

summary = df.groupby("system").agg(
    mean_latency_ms=("latency_ms", "mean"),
    success_rate=("success", "mean"),
    mean_completeness=("completeness_score", "mean"),
).reset_index()

print(summary.round(3).to_string(index=False))

fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

axes[0].bar(summary["system"], summary["mean_latency_ms"])
axes[0].set_title("Mean API Latency")
axes[0].set_ylabel("Milliseconds")
axes[0].tick_params(axis="x", rotation=12)

axes[1].bar(summary["system"], summary["mean_completeness"])
axes[1].set_title("Mean Output Completeness")
axes[1].set_ylabel("Score (0–100)")
axes[1].set_ylim(0, 100)
axes[1].tick_params(axis="x", rotation=12)

fig.suptitle("QuantLens: Single LLM vs Two-Agent Prototype")
fig.tight_layout()
fig.savefig(OUTPUT, dpi=300, bbox_inches="tight")
plt.show()

print(f"\nSaved report graph to: {OUTPUT}")