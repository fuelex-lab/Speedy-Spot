# Dataflow Deep Dive

This page describes end-to-end data movement through Speedy-Spot.

## Ingress to execution

1. Producer sends request to `POST /jobs`.
2. API validates type/payload and adds `id` + defaults.
3. Queue stores by priority.
4. Worker fetches highest-priority job.
5. Handler executes domain operation.
6. Metrics/state updates are persisted in-memory provider abstractions.

## Domain-specific flow: playback

1. Optional voice update job (`lavalink.voice.update`) initializes player voice state.
2. Playback job (`playback.enqueue`) arrives with query or encoded data.
3. Query path resolves via Lavalink `loadtracks`.
4. Worker dispatches encoded track via Lavalink player patch.
5. Guild playback state is merged with dispatch and routing metadata.

## Domain-specific flow: spotify

1. OAuth callback exchanges authorization code.
2. Token store persists token state.
3. Playlist sync job fetches pages with retry/backoff.
4. Tracks are normalized and returned to handler context.

## State mutation boundaries

- Queue state: queue provider implementation.
- Playback state: `PlaybackCoordinator`.
- Spotify token state: token store provider.
- Metrics state: in-memory counters/gauges.

## Consistency notes

- Current state stores are process-scoped unless Redis/file providers are used.
- Persistent production topology should externalize queue and token state.
