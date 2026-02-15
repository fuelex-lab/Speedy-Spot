# Shard Model

Shards are distributed by deterministic round-robin across clusters.

## Assignment algorithm

For shard `s` and cluster count `N`:

- `cluster_index = s % N`

This yields even spread and repeatability without external coordination.

## Example

With 8 shards and 3 clusters:

- `cluster-1`: `0, 3, 6`
- `cluster-2`: `1, 4, 7`
- `cluster-3`: `2, 5`

## Why deterministic assignment matters

- simplifies incident debugging
- keeps routing behavior stable across restarts
- avoids accidental shard drift between operators

## Interaction with Lavalink routing

Cluster-level Lavalink assignment is layered on top of shard assignment:

1. clusters get preferred Lavalink node IDs
2. workers use `payload.shardId` first (or `guildId` hash fallback)
3. Lavalink client tries preferred node first, then failover nodes

## Future evolution options

- weighted shard assignment per cluster capacity
- dynamic rebalance API with drain/migrate workflow
- persistence layer for assignment history
