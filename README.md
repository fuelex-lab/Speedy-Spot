# Speedy-Spot

Speedy-Spot is an open-source custom worker and cluster system for high-traffic Discord music bots using Spotify login and playlist access.

## Goals

- Isolate workloads with workers and cluster orchestration
- Reduce load and improve request latency under heavy traffic
- Provide resilient queue processing with retries and dead-letter handling
- Expose operational metrics and health endpoints
- Deliver complete MkDocs documentation hosted on GitHub Pages

## Project Status

Foundation bootstrapped in JavaScript with:

- `src/cluster` shard and worker orchestration
- `src/workers` worker runtime and job execution
- `src/queue` pluggable queue provider (`memory` and `redis`)
- `src/auth` Spotify OAuth session, retry-aware token refresh, and playlist sync pipeline
- `src/lavalink` Lavalink client, node failover, shard/cluster routing, voice updates, and player dispatch
- `src/api` operational HTTP API with strict job validation and admin token auth
- `src/playback` guild-level execution coordination
- `src/telemetry` structured logging + in-memory metrics

## Quick Start

```bash
npm install
npm run start
```

Server defaults to `http://localhost:3000`.

### Useful Endpoints

- `GET /health`
- `GET /metrics`
- `GET /clusters`
- `GET /auth/spotify/url?userId=<id>`
- `POST /jobs` enqueue validated jobs
- `POST /auth/spotify/callback` exchange auth code for token

## Key Environment Variables

- `QUEUE_PROVIDER=memory|redis` (default `memory`)
- `REDIS_URL=redis://localhost:6379`
- `REDIS_KEY_PREFIX=speedyspot`
- `TOKEN_STORE_PROVIDER=memory|file|encrypted-file` (default `memory`)
- `TOKEN_STORE_FILE=./.speedyspot-tokens.json`
- `TOKEN_STORE_ENCRYPTION_KEY=<32-byte base64 or 64-char hex>` required for `encrypted-file`
- `ADMIN_API_TOKEN=<secret>` (optional; enables header auth for control endpoints)
- `SPOTIFY_MOCK_MODE=true|false` (default `true`)
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_MAX_RETRIES`, `SPOTIFY_RETRY_BASE_MS`
- `LAVALINK_NODES` JSON array of nodes, example:
  `[{"id":"main","url":"http://127.0.0.1:2333","password":"youshallnotpass","sessionId":"abc123"}]`
- `LAVALINK_DEFAULT_SOURCE` (default `spsearch`)

## Documentation

- Sources: `docs/`
- MkDocs config: `mkdocs.yml`
- Local docs serve: `npm run docs:serve`
