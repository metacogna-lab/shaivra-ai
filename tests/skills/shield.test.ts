/**
 * Skills foundation: Shield scripts (domain_watch, credential_scan stub).
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const shieldScripts = path.join(ROOT, "skills/shield-counterintel/scripts");

describe("Shield scripts", () => {
  it("domain_watch.py returns domain and status", () => {
    const out = spawnSync("python3", [path.join(shieldScripts, "domain_watch.py"), "example.com"], {
      encoding: "utf-8",
      cwd: ROOT,
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(data).toHaveProperty("domain", "example.com");
    expect(data).toHaveProperty("status");
  });

  it("credential_scan.sh returns stub without API key", () => {
    const out = spawnSync("bash", [path.join(shieldScripts, "credential_scan.sh"), "test"], {
      encoding: "utf-8",
      cwd: ROOT,
      env: { ...process.env, LEAKCHECK_API_KEY: "" },
    });
    expect(out.status).toBe(0);
    const data = JSON.parse(out.stdout);
    expect(data).toHaveProperty("query", "test");
    expect(data).toHaveProperty("status");
  });
});
