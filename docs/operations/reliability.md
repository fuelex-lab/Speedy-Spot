# Reliability

## Existing protections

- bounded retries + dead-letter queue
- job-level failure isolation
- shard-aware and failover-aware Lavalink routing
- Spotify retry/backoff behavior
- API-side validation gate

## High-risk zones

- upstream dependency outages (Spotify/Lavalink)
- queue provider downtime
- malformed producer payload bursts
- stale Lavalink session IDs

## Hardening checklist

- use Redis queue in non-trivial environments
- set `ADMIN_API_TOKEN`
- use encrypted token store for persistence
- configure multiple Lavalink nodes
- monitor retry and dead-letter rates
- prioritize `lavalink.voice.update` jobs
