"""Thin wrappers that invoke Forge skill scripts or return stub data."""
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FORGE_SCRIPTS = REPO_ROOT / "skills" / "forge-influence" / "scripts"


def simulate_network(graph: dict, seed_nodes: list[str], steps: int = 5) -> list[str]:
    """Run simulate_network.py; return list of activated node ids."""
    script = FORGE_SCRIPTS / "simulate_network.py"
    if not script.exists():
        return seed_nodes
    out = subprocess.run(
        ["python3", str(script)],
        input=json.dumps({"graph": graph, "seeds": seed_nodes}),
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        data = json.loads(out.stdout) if out.stdout else {}
        return data.get("activated", seed_nodes)
    except json.JSONDecodeError:
        return seed_nodes


def narrative_embedding(text: str) -> list[float]:
    """Run narrative_embedding.py; return embedding vector or stub zeros."""
    script = FORGE_SCRIPTS / "narrative_embedding.py"
    if not script.exists():
        return [0.0] * 64
    out = subprocess.run(
        ["python3", str(script)],
        input=json.dumps({"text": text}),
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        data = json.loads(out.stdout) if out.stdout else {}
        return data.get("embedding", [0.0] * 64)
    except json.JSONDecodeError:
        return [0.0] * 64
