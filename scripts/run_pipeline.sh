#!/usr/bin/env bash
# Unified pipeline driver: Lens -> Forge -> Shield. Usage: run_pipeline.sh <target> [sources]
# Claude Code, Gemini CLI, and OpenAI callers can use this entrypoint for reproducible runs.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?Usage: $0 <target> [sources]}"
SOURCES="${2:-web}"
cd "$ROOT"
python3 langgraph/graph.py "$TARGET" "$SOURCES"
