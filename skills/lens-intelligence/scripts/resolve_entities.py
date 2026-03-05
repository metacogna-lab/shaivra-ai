#!/usr/bin/env python3
"""Read entity list JSON from stdin or file; output resolved/merged entities (stub: dedup by name)."""
import json
import sys

def resolve(entities: list[dict]) -> list[dict]:
    seen = {}
    out = []
    for e in entities:
        name = (e.get("name") or e.get("text") or "").strip().lower()
        if name and name not in seen:
            seen[name] = len(out)
            out.append({**e, "name": e.get("name") or e.get("text")})
    return out

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)
    list_in = data if isinstance(data, list) else data.get("entities", [])
    print(json.dumps(resolve(list_in), indent=2))
