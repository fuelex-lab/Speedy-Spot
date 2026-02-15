# Development Setup

## Requirements

- Node.js 20+
- npm 10+
- Python 3 (docs preview)
- optional Redis
- optional Lavalink node

## Install

```bash
npm install
```

## Environment bootstrap

Create `.env` with a baseline profile.

```bash
PORT=3000
NODE_ENV=development

CLUSTER_COUNT=2
WORKERS_PER_CLUSTER=2
SHARD_COUNT=8
MAX_JOB_RETRIES=3

QUEUE_PROVIDER=memory
TOKEN_STORE_PROVIDER=memory
ADMIN_API_TOKEN=dev-token

SPOTIFY_MOCK_MODE=true
SPOTIFY_MAX_RETRIES=3
SPOTIFY_RETRY_BASE_MS=300

LAVALINK_DEFAULT_SOURCE=spsearch
LAVALINK_NODES=[{"id":"main","url":"http://127.0.0.1:2333","password":"youshallnotpass","sessionId":"session-main"}]
```

## Start runtime

```bash
npm run start
```

## Quick verification

```bash
curl http://localhost:3000/health
curl -H 'x-api-token: dev-token' http://localhost:3000/clusters
curl -H 'x-api-token: dev-token' http://localhost:3000/metrics
```

## Run tests

```bash
npm test
```

## Serve docs

```bash
pip install mkdocs mkdocs-material
npm run docs:serve
```

## Recommended local profiles

- `local-min`: memory queue + mock Spotify + one Lavalink node.
- `local-prodish`: redis queue + encrypted token store + multiple Lavalink nodes.
