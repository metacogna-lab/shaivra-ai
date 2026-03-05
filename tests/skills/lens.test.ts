/**
 * Skills foundation: Lens scripts (entity_extraction, resolve_entities, build_graph).
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const lensScripts = path.join(ROOT, "skills/lens-intelligence/scripts");

describe("Lens scripts", () => {
  it("resolve_entities.py accepts JSON array and returns array", () => {
    const out = spawnSync("python3", [
      path.join(lensScripts, "resolve_entities.py"),
    ], {
      input: JSON.stringify([{ name: "Alice", type: "PERSON" }, { name: "alice", type: "PERSON" }]),
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });

  it("entity_extraction.py returns array (or error) from stdin", () => {
    const out = spawnSync("python3", [
      path.join(lensScripts, "entity_extraction.py"),
    ], {
      input: "Alice met Bob in Paris.",
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(Array.isArray(data) || (typeof data === "object" && "error" in data)).toBe(true);
  });

  it("build_graph.ts returns nodes and edges", () => {
    const input = JSON.stringify({
      entities: [{ id: "e1", name: "A", type: "person" }, { id: "e2", name: "B", type: "org" }],
    });
    const out = spawnSync("bun", ["run", path.join(lensScripts, "build_graph.ts")], {
      input,
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(data).toHaveProperty("nodes");
    expect(data).toHaveProperty("edges");
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(data.nodes.length).toBe(2);
  });
});
