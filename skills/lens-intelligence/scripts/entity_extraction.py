#!/usr/bin/env python3
"""Extract entities from stdin text using NER; output JSON array. Optional: pip install spacy && python -m spacy download en_core_web_trf."""
import json
import sys

def extract_entities(text: str) -> list[dict]:
    try:
        import spacy
        nlp = spacy.load("en_core_web_trf")
    except (ImportError, OSError) as e:
        print(json.dumps({"error": "spacy or en_core_web_trf not available", "detail": str(e)}), file=sys.stderr)
        return []
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "type": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
        })
    return entities

if __name__ == "__main__":
    text = sys.stdin.read()
    result = extract_entities(text)
    print(json.dumps(result, indent=2))
