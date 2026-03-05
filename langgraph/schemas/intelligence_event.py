"""Intelligence event schema for LangGraph; maps to IntelligenceEvent in src/types/intelligence.ts."""
from dataclasses import dataclass
from typing import Any

from .entity import Entity


@dataclass
class IntelligenceEvent:
    """Top-level event wrapper; entities, observations, relationships from one tool run."""
    id: str
    trace_id: str
    tool: str
    target: str
    status: str  # success | partial | failed
    entities: list[Entity]
    metadata: dict[str, Any]
