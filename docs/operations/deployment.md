# Deployment Guide

## Deployment profiles

### Local development

- `QUEUE_PROVIDER=memory`
- `TOKEN_STORE_PROVIDER=memory`
- `SPOTIFY_MOCK_MODE=true`

### Single-node production-like

- `QUEUE_PROVIDER=redis`
- `TOKEN_STORE_PROVIDER=encrypted-file`
- at least 2 Lavalink nodes configured

### Multi-node production

- shared Redis queue
- centralized secret management
- multiple app instances with same config contract
- multiple Lavalink nodes with health monitoring

## Pre-deploy checklist

1. Confirm all required env vars are set.
2. Validate `LAVALINK_NODES` JSON schema.
3. Validate `TOKEN_STORE_ENCRYPTION_KEY` format when used.
4. Smoke test `/health`, `/metrics`, `/clusters`.
5. Smoke test one voice update + one playback job.

## Rollout checklist

1. Deploy with conservative cluster/worker settings.
2. Observe queue and failure metrics.
3. Increase capacity in small increments.
4. Keep rollback config ready.

## Rollback plan

- revert to last known-good image/config
- preserve queue data (if Redis)
- disable new producer traffic until stable
