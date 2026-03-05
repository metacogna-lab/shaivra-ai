# Ingestion sources

Public sources aligned with the Lens UI and pipeline. Scripts accept a source list (e.g. `--sources web,x,reddit`).

| Id | Name | Description |
|----|------|-------------|
| web | Universal Web | Broad surface web crawling and indexing |
| x | X (Twitter) | Real-time social sentiment and narrative tracking |
| reddit | Reddit | Community-driven intelligence and niche discussions |
| linkedin | LinkedIn | Professional networking and corporate entity mapping |
| github | GitHub | Technical infrastructure and developer activity |
| news | Global News | Mainstream media monitoring and event correlation |

Ingestion is implemented as stubs or live integrations per environment; see scripts/ingest_sources.sh.
