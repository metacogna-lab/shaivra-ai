# Threat models

Design guidance for counterintelligence monitoring.

## Assets

- Investigator identities (credentials, domains, handles)
- Investigation data and graph outputs
- API keys and tool access

## Threats

- Credential leakage (paste sites, breach dumps)
- Domain squatting or spoofing of analyst/org domains
- Phishing and social engineering targeting analysts
- Compromise of tooling or API keys

## Defenses

- **Context isolation:** Scripts do not depend on global app state; pass inputs explicitly.
- **Tool permission:** Sensitive scripts (credential_scan) use env-based keys and rate limits.
- **Schema validation:** Validate inputs/outputs at boundaries.
- **Sandbox:** Optional Docker or restricted execution for production.
- **Audit:** Log invocations and outcomes for sensitive operations.
