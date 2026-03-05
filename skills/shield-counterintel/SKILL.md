---
name: detecting-intelligence-threats
description: Detects digital threats targeting investigators including leaked credentials, domain spoofing, and targeted attacks.
---

# Counterintelligence Monitoring

## Instructions

1. **Monitor credential leaks** — credential_scan.sh (env-based API key; rate limits in production).
2. **Scan domain registrations** — domain_watch.py (stub or live per env).
3. **Deploy honeypots** — deploy_honeypot.ts (stub; no real deploy in this phase).
4. **Detect phishing infrastructure** — Document in references; optional scripts later.
5. **Alert analysts** — Output threat_surface.json and/or alerts.

## Scripts

- `credential_scan.sh` — Query leak check API; use LEAKCHECK_API_KEY in production.
- `domain_watch.py` — Domain check; output JSON stub.
- `deploy_honeypot.ts` — Output honeypot config JSON stub.

## Security

Context isolation, tool permission, schema validation, sandbox, audit. See references/threat_models.md and SKILLS_BEST_PRACTICES.md.
