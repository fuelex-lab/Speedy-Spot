# Speedy-Spot

Speedy-Spot is a distributed execution runtime for Discord music backends that need predictable throughput under heavy concurrent load.

It combines:

- shard-aware cluster orchestration
- worker-isolated job execution
- queue-based backpressure and retry management
- Spotify OAuth + playlist ingestion
- Lavalink voice + player dispatch routing

## Audience

This documentation is written for:

- backend engineers integrating Discord music workflows
- operators responsible for reliability and scaling
- contributors extending queue, auth, or playback modules

## Documentation map

- `Architecture`: runtime decomposition, queue flow, shard logic, Lavalink routing.
- `Auth`: Spotify token lifecycle, storage modes, retry behavior.
- `Development`: local setup, test strategy, engineering roadmap.
- `Operations`: scaling controls, reliability model, incident runbooks.
- `Reference`: API contract, config matrix, metrics, schemas, security model.
- `Examples`: practical payloads and event-driven integration flows.

## Runtime summary

1. Producer submits validated job to `POST /jobs`.
2. Queue stores job by priority with bounded retries.
3. Worker executes domain handler (Spotify sync / voice update / playback enqueue).
4. Worker emits telemetry counters and updates guild playback state.
5. Cluster and metrics endpoints expose runtime health for operators.

## Current production-ready foundation

- deterministic cluster/shard assignment
- Lavalink node preference + failover behavior
- encrypted token-store option for persistent Spotify credentials
- API token protection for operational endpoints
- test coverage across API, queue, Spotify, Lavalink, and worker paths
