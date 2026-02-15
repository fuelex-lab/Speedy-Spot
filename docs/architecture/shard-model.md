# Shard Model

Shards are assigned round-robin across clusters.

Example with 3 clusters and 8 shards:

- `cluster-1`: 0, 3, 6
- `cluster-2`: 1, 4, 7
- `cluster-3`: 2, 5

This strategy keeps distribution balanced and deterministic.
