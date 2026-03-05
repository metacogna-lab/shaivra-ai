# Leak sources

Sources used for credential and leak monitoring.

## Public / API

- **LeakCheck** (leakcheck.io) — API for querying breach/paste data; use env `LEAKCHECK_API_KEY` in production; rate limits apply.
- **HaveIBeenPwned** — Optional; API for email/domain breach check.

## Usage

credential_scan.sh calls LeakCheck public API or stub; production must use API key and respect ToS and rate limits. Document in script and ai_orchestration security section.
