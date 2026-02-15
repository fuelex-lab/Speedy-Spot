# Architecture Overview

Speedy-Spot separates control-plane concerns from execution-plane concerns to keep load handling and failure isolation explicit.

## Module boundaries

- `src/api`: request validation, auth guard, enqueue boundary.
- `src/queue`: provider abstraction + retry/dead-letter semantics.
- `src/cluster`: shard and worker-pool orchestration.
- `src/workers`: job execution runtime.
- `src/auth`: Spotify token and playlist services.
- `src/lavalink`: routing, resolve, voice patch, player patch.
- `src/playback`: guild-scoped state + lock discipline.
- `src/telemetry`: counters, gauges, structured logs.

## Control plane

Control plane responsibilities:

- validate inbound job payload shape
- enforce optional API token guard
- expose cluster snapshot and metric views
- provide Spotify callback exchange endpoint

Control plane intentionally does not execute heavy job logic.

## Execution plane

Execution plane responsibilities:

- dequeue jobs by priority order
- route shard-aware playback and voice operations
- call Spotify/Lavalink external APIs
- apply retry policy and DLQ fallback
- commit guild state updates for observability/debugging

## Design invariants

- job handlers are stateless beyond explicit stores/coordinator state
- retries are bounded and observable
- routing decisions are deterministic for a given shard/guild input
- external-call failure must not crash worker loop

## Failure handling model

- per-job failure: metric increment + requeue/DLQ
- per-node Lavalink failure: preferred node fallback to next candidate
- Spotify rate limits: bounded retry with backoff
- malformed requests: rejected at API boundary before queue insertion
