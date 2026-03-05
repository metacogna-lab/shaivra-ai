#!/usr/bin/env python3
"""Check domain; output JSON stub. Usage: domain_watch.py <domain>"""
import json
import sys

def main():
    domain = (sys.argv[1:] or [""])[0]
    if not domain:
        print(json.dumps({"error": "domain required"}), file=sys.stderr)
        sys.exit(1)
    print(json.dumps({"domain": domain, "status": "stub"}))

if __name__ == "__main__":
    main()
