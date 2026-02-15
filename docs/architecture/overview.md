# Architecture Overview

Speedy-Spot is divided into modular components under `src/`:

- `src/api`: HTTP control surface for health, metrics, auth callback, and job enqueue.
- `src/cluster`: cluster manager and shard allocation logic.
- `src/workers`: worker runtime for job processing.
- `src/queue`: queueing and retry/dead-letter logic.
- `src/auth`: Spotify login/token lifecycle scaffold.
- `src/lavalink`: Lavalink node client and query resolution.
- `src/playback`: guild-level playback coordination.
- `src/telemetry`: logging and in-memory metrics.

The system follows a control-plane and execution-plane model:

1. Control plane accepts requests and enqueues jobs.
2. Cluster manager owns shard assignment and worker pools.
3. Workers consume and process queued jobs with retries.
4. Playback jobs can resolve query input via Lavalink before state enqueue.
