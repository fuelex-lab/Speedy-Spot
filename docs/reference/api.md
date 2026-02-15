# API Reference

If `ADMIN_API_TOKEN` is set, protected endpoints require header `x-api-token`.

Public endpoints:

- `GET /health`
- `POST /auth/spotify/callback`

Protected endpoints:

- `GET /metrics`
- `GET /clusters`
- `GET /auth/spotify/url?userId=<id>`
- `POST /jobs`
- `POST /demo/seed`

## `GET /clusters`
Returns cluster snapshots including shard assignment and `lavalinkNodeIds`.

## `POST /jobs`
Enqueue a worker job with strict validation.

Supported job types:

- `playback.enqueue` requires `payload.guildId` and (`payload.trackId` or `payload.query`)
- `spotify.playlist.sync` requires `payload.userId` and `payload.playlistId`
- `lavalink.voice.update` requires `payload.guildId`, `payload.sessionId`, `payload.token`, `payload.endpoint`

Optional fields for `playback.enqueue`:

- `payload.source` (Lavalink search source such as `spsearch`, `ytsearch`)
- `payload.shardId` (numeric shard hint for node routing)
- `payload.encoded` (pre-resolved encoded track)
- `payload.dispatchToLavalink` (default `true`)
- `payload.noReplace` (default `true`)
- `payload.pause`, `payload.volume`, `payload.position`

Optional fields for `lavalink.voice.update`:

- `payload.shardId` (numeric shard hint for node routing)

Optional fields for `spotify.playlist.sync`:

- `payload.pageLimit` (max 100)
- `payload.maxTracks`
