"""Defense node: Shield credential/domain/honeypot checks."""
from langgraph.tools import shield_tools


def run(state: dict) -> dict:
    """Run Shield checks; state has target. Return state with threat_surface."""
    target = state.get("target", "")
    credential = shield_tools.credential_scan(target) if target else {"status": "stub"}
    domain = shield_tools.domain_watch(target) if target else {"status": "stub"}
    honeypot = shield_tools.deploy_honeypot()
    return {
        **state,
        "threat_surface": {
            "credential": credential,
            "domain": domain,
            "honeypot": honeypot,
        },
    }
