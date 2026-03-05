/**
 * Output honeypot config JSON stub. No real deployment in this phase.
 */
const config = {
  type: "stub",
  message: "Set honeypot type and target in a later phase",
  env: process.env.HONEYPOT_TYPE ?? "credential",
};
process.stdout.write(JSON.stringify(config, null, 2));
