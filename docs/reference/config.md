# Configuration

## Core runtime

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | Runtime environment |
| `CLUSTER_COUNT` | `2` | Number of cluster groups |
| `WORKERS_PER_CLUSTER` | `2` | Workers per cluster |
| `SHARD_COUNT` | `8` | Total shard count |
| `MAX_JOB_RETRIES` | `3` | Retry budget before DLQ |

## Queue

| Variable | Default | Description |
| --- | --- | --- |
| `QUEUE_PROVIDER` | `memory` | `memory` or `redis` |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL |
| `REDIS_KEY_PREFIX` | `speedyspot` | Queue key prefix |

## Security and token storage

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_API_TOKEN` | empty | Protects operational routes |
| `TOKEN_STORE_PROVIDER` | `memory` | `memory`, `file`, `encrypted-file` |
| `TOKEN_STORE_FILE` | `./.speedyspot-tokens.json` | File path for file stores |
| `TOKEN_STORE_ENCRYPTION_KEY` | empty | Required for encrypted-file |

## Spotify

| Variable | Default | Description |
| --- | --- | --- |
| `SPOTIFY_CLIENT_ID` | empty | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | empty | Spotify app secret |
| `SPOTIFY_REDIRECT_URI` | `http://localhost:3000/auth/spotify/callback` | OAuth redirect URI |
| `SPOTIFY_SCOPES` | `playlist-read-private playlist-read-collaborative` | OAuth scopes |
| `SPOTIFY_MOCK_MODE` | `true` | Real vs mock mode |
| `SPOTIFY_MAX_RETRIES` | `3` | Retry attempts |
| `SPOTIFY_RETRY_BASE_MS` | `300` | Backoff base (ms) |

## Lavalink

| Variable | Default | Description |
| --- | --- | --- |
| `LAVALINK_NODES` | `[]` | JSON array of nodes |
| `LAVALINK_DEFAULT_SOURCE` | `spsearch` | Query prefix fallback |

Node object schema:

```json
{
  "id": "main",
  "url": "http://127.0.0.1:2333",
  "password": "youshallnotpass",
  "sessionId": "session-main"
}
```
