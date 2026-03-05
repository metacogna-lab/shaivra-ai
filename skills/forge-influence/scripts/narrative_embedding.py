#!/usr/bin/env python3
"""Read narrative text or graph; output embedding vector stub or call embedding API. Optional deps."""
import json
import sys

def embed(text: str) -> list[float]:
    # Stub: return fixed-dimension zero vector; replace with real embedding (e.g. sentence-transformers) when deps available
    return [0.0] * 64

if __name__ == "__main__":
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        data = {"text": ""}
    text = data.get("text", data.get("narrative", ""))
    if isinstance(data.get("nodes"), list):
        text = " ".join(str(n.get("label", n)) for n in data["nodes"][:10])
    vec = embed(text or "stub")
    print(json.dumps({"embedding": vec, "dim": len(vec)}))
