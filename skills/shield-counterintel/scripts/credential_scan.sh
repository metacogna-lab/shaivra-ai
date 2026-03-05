#!/usr/bin/env bash
# Query leak check API. Usage: credential_scan.sh <query>. Production: set LEAKCHECK_API_KEY and respect rate limits.
set -e
QUERY="${1:-}"
if [ -z "$QUERY" ]; then
  echo "Usage: $0 <query>" >&2
  exit 1
fi
# Stub: if no API key, output stub; otherwise curl (use API key in URL or header per provider docs)
if [ -z "${LEAKCHECK_API_KEY:-}" ]; then
  echo "{\"query\":\"$QUERY\",\"status\":\"stub\",\"message\":\"Set LEAKCHECK_API_KEY for live check\"}"
else
  curl -s "https://leakcheck.io/api/public?query=$QUERY" || echo "{\"query\":\"$QUERY\",\"status\":\"error\"}"
fi
