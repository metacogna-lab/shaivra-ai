/**
 * Skills foundation: LangGraph pipeline output shape.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

describe("LangGraph pipeline", () => {
  it("graph.py runs and returns entity_graph, narrative_simulation, threat_surface", () => {
    const out = spawnSync("python3", [path.join(ROOT, "langgraph/graph.py"), "example.com"], {
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(data).toHaveProperty("entity_graph");
    expect(data).toHaveProperty("narrative_simulation");
    expect(data).toHaveProperty("threat_surface");
    expect(data.entity_graph).toHaveProperty("nodes");
    expect(data.entity_graph).toHaveProperty("edges");
    expect(data.narrative_simulation).toHaveProperty("activated");
    expect(data.threat_surface).toHaveProperty("credential");
    expect(data.threat_surface).toHaveProperty("domain");
  });
});
