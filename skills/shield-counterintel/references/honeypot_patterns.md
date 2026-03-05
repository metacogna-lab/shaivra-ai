# Honeypot patterns

Design guidance for defensive honeypots in counterintelligence.

## Purpose

Deploy decoy assets (e.g. fake login, fake document) to detect and attribute targeting of investigators.

## Patterns

- **Credential honeypot:** Fake login page; log and alert on access.
- **Document honeypot:** Canary file or link; track opens and location.
- **API honeypot:** Fake endpoint that logs and blocks abuse.

## Implementation

deploy_honeypot.ts outputs a config JSON stub only in this phase; no real deployment. Future: infra/docker or Terraform for isolated honeypot containers.
