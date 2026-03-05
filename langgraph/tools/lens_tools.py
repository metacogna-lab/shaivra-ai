"""Thin wrappers that invoke Lens skill scripts or return stub data."""
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LENS_SCRIPTS = REPO_ROOT / "skills" / "lens-intelligence" / "scripts"


def ingest_sources(target: str, sources: str = "web") -> dict:
    """Run ingest_sources.sh; return parsed JSON or stub."""
    script = LENS_SCRIPTS / "ingest_sources.sh"
    if not script.exists():
        return {"target": target, "sources": sources, "status": "stub"}
    cmd = ["bash", str(script), target, sources]
    out = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    if out.returncode != 0:
        return {"target": target, "sources": sources, "status": "error", "stderr": out.stderr}
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return {"target": target, "sources": sources, "status": "stub", "raw": out.stdout}


def entity_extraction(text: str) -> list[dict]:
    """Run entity_extraction.py; return list of entities or empty on error."""
    script = LENS_SCRIPTS / "entity_extraction.py"
    if not script.exists():
        return []
    out = subprocess.run(
        ["python3", str(script)],
        input=text,
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else []
    except json.JSONDecodeError:
        return []


def resolve_entities(entities: list[dict]) -> list[dict]:
    """Run resolve_entities.py; return resolved list."""
    script = LENS_SCRIPTS / "resolve_entities.py"
    if not script.exists():
        return entities
    out = subprocess.run(
        ["python3", str(script)],
        input=json.dumps(entities),
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else entities
    except json.JSONDecodeError:
        return entities


def build_graph(entities: list[dict], relationships: list[dict] | None = None) -> dict:
    """Run build_graph.ts via bun/node or return stub."""
    script = LENS_SCRIPTS / "build_graph.ts"
    payload = {"entities": entities, "relationships": relationships or []}
    if not script.exists():
        return {"nodes": [{"id": e.get("id", i), "label": e.get("name", e.get("text", "")), "type": e.get("type", "unknown")} for i, e in enumerate(entities)], "edges": []}
    out = subprocess.run(
        ["bun", "run", str(script)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else {"nodes": [], "edges": []}
    except json.JSONDecodeError:
        return {"nodes": [], "edges": []}
