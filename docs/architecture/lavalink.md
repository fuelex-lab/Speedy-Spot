# Lavalink Integration

Speedy-Spot supports Lavalink-backed track resolution, voice updates, and player dispatch for playback jobs.

## Flow

1. API receives `lavalink.voice.update` after Discord voice state/server events.
2. Worker patches Lavalink player with voice payload (`sessionId`, `token`, `endpoint`).
3. API receives `playback.enqueue` with either `trackId` or `query`.
4. If `query` is provided, worker resolves it through Lavalink `/v4/loadtracks` using preferred node routing.
5. Worker dispatches encoded track to Lavalink player session endpoint.
6. Worker stores normalized playback metadata in guild playback state.

## Shard and cluster routing

- Cluster manager maps clusters to Lavalink nodes deterministically.
- Worker chooses preferred node from router using `payload.shardId` (if present) or `payload.guildId` hash.
- Lavalink client tries preferred node first and then failover nodes.

## Player and voice updates

- Player endpoint: `PATCH /v4/sessions/{sessionId}/players/{guildId}`
- Node config requires `sessionId` to enable player and voice patch operations.
