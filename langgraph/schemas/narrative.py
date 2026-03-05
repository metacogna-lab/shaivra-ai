"""Narrative schema for LangGraph; Forge-specific logical type."""
from dataclasses import dataclass


@dataclass
class Narrative:
    """Narrative object for influence modeling; not a canonical EntityReference type."""
    narrative_id: str
    topic: str
    origin: str  # entity_id
    sentiment: float
    vector_embedding: list[float]
