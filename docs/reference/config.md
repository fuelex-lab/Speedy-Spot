# Configuration

Environment variables:

- `PORT` (default `3000`)
- `CLUSTER_COUNT` (default `2`)
- `WORKERS_PER_CLUSTER` (default `2`)
- `SHARD_COUNT` (default `8`)
- `MAX_JOB_RETRIES` (default `3`)
- `NODE_ENV` (default `development`)
- `QUEUE_PROVIDER` (`memory` or `redis`, default `memory`)
- `REDIS_URL` (default `redis://localhost:6379`)
- `REDIS_KEY_PREFIX` (default `speedyspot`)
- `TOKEN_STORE_PROVIDER` (`memory`, `file`, or `encrypted-file`, default `memory`)
- `TOKEN_STORE_FILE` (default `./.speedyspot-tokens.json`)
- `TOKEN_STORE_ENCRYPTION_KEY` (required for `encrypted-file`; 32-byte base64 or 64-char hex)
- `ADMIN_API_TOKEN` (empty by default; when set, clients must send `x-api-token`)
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` (default `http://localhost:3000/auth/spotify/callback`)
- `SPOTIFY_SCOPES` (default `playlist-read-private playlist-read-collaborative`)
- `SPOTIFY_MOCK_MODE` (default `true`)
- `SPOTIFY_MAX_RETRIES` (default `3`)
- `SPOTIFY_RETRY_BASE_MS` (default `300`)
- `LAVALINK_NODES` (JSON array of node objects: `id`, `url`, `password`, `sessionId`)
- `LAVALINK_DEFAULT_SOURCE` (default `spsearch`)
