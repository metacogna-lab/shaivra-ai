"""Entity schema for LangGraph; maps to EntityReference in src/types/intelligence.ts."""
from dataclasses import dataclass
from typing import Any


@dataclass
class Entity:
    """Skill-layer entity; map id/type/name/aliases/confidence to canonical EntityReference."""
    id: str
    type: str  # person | organization | infrastructure | event | unknown
    name: str
    aliases: list[str]
    confidence: float
    sources: list[str]
    attributes: dict[str, Any]
