"""Thin wrappers that invoke Shield skill scripts or return stub data."""
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SHIELD_SCRIPTS = REPO_ROOT / "skills" / "shield-counterintel" / "scripts"


def credential_scan(query: str) -> dict:
    """Run credential_scan.sh; return parsed JSON or stub."""
    script = SHIELD_SCRIPTS / "credential_scan.sh"
    if not script.exists():
        return {"query": query, "status": "stub"}
    cmd = ["bash", str(script), query]
    out = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else {"query": query, "status": "stub"}
    except json.JSONDecodeError:
        return {"query": query, "status": "error", "raw": out.stdout}


def domain_watch(domain: str) -> dict:
    """Run domain_watch.py; return parsed JSON or stub."""
    script = SHIELD_SCRIPTS / "domain_watch.py"
    if not script.exists():
        return {"domain": domain, "status": "stub"}
    out = subprocess.run(
        ["python3", str(script), domain],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else {"domain": domain, "status": "stub"}
    except json.JSONDecodeError:
        return {"domain": domain, "status": "stub"}


def deploy_honeypot() -> dict:
    """Run deploy_honeypot.ts; return config stub."""
    script = SHIELD_SCRIPTS / "deploy_honeypot.ts"
    if not script.exists():
        return {"type": "stub"}
    out = subprocess.run(
        ["bun", "run", str(script)],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )
    try:
        return json.loads(out.stdout) if out.stdout else {"type": "stub"}
    except json.JSONDecodeError:
        return {"type": "stub"}
