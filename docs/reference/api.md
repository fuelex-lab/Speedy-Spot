# API Reference

If `ADMIN_API_TOKEN` is set, send:

```http
x-api-token: <ADMIN_API_TOKEN>
```

## Public

- `GET /health`
- `POST /auth/spotify/callback`

## Protected

- `GET /metrics`
- `GET /clusters`
- `GET /auth/spotify/url?userId=<id>`
- `POST /jobs`
- `POST /demo/seed`

## GET /health

```json
{
  "status": "ok",
  "clusters": 2,
  "queueDepth": 0
}
```

## GET /clusters

Returns cluster state including shard list and `lavalinkNodeIds`.

## GET /metrics

Returns counters, gauges, queue and dead-letter depths, and cluster snapshot.

## GET /auth/spotify/url

Query params:

- `userId` (required)
- `state` (optional)
- `scope` (optional)

## POST /auth/spotify/callback

```json
{
  "userId": "user-1",
  "code": "spotify-auth-code"
}
```

## POST /jobs

Supported types:

- `playback.enqueue`
- `spotify.playlist.sync`
- `lavalink.voice.update`

### playback.enqueue

Required:

- `guildId`
- one of `trackId` or `query`

Optional:

- `source`
- `shardId`
- `encoded`
- `dispatchToLavalink`
- `noReplace`
- `pause`
- `volume`
- `position`

### spotify.playlist.sync

Required:

- `userId`
- `playlistId`

Optional:

- `pageLimit`
- `maxTracks`

### lavalink.voice.update

Required:

- `guildId`
- `sessionId`
- `token`
- `endpoint`

Optional:

- `shardId`

## Error shape

```json
{
  "error": "validation message or runtime message"
}
```
