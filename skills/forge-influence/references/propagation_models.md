# Propagation models

How narrative or influence spreads across the graph.

## Simple diffusion

- **IC (Independent Cascade):** Each activated node has one chance to activate each neighbor with probability p (e.g. 0.3).
- **Steps:** Fixed number of rounds; seed nodes initially activated.
- Implemented in simulate_network.py (NetworkX); configurable step count and probability.

## Extensions (future)

- Weighted edges by relationship strength or psychographic fit
- Time decay or saturation
- Competing narratives (multiple seeds, resistance threshold)
