/**
 * Skills foundation: Forge simulate_network.py.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const forgeScripts = path.join(ROOT, "skills/forge-influence/scripts");

describe("Forge scripts", () => {
  it("simulate_network.py returns activated list", () => {
    const input = JSON.stringify({
      graph: {
        nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
        edges: [{ source: "a", target: "b" }, { source: "b", target: "c" }],
      },
      seeds: ["a"],
    });
    const out = spawnSync("python3", [path.join(forgeScripts, "simulate_network.py")], {
      input,
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(data).toHaveProperty("activated");
    expect(Array.isArray(data.activated)).toBe(true);
    expect(data.activated).toContain("a");
  });
});
