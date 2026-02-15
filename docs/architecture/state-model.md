# State Model

## Queue state

Tracks pending, retrying, and dead-lettered jobs.

## Playback state

Per guild metadata including:

- cluster/shard routing context
- chosen Lavalink node
- encoded track metadata
- dispatch flags
- voice session details when available

## Auth/token state

Per user Spotify token bundle:

- access token
- refresh token
- expiry timestamp

## Metrics state

Counters and gauges for runtime diagnostics.

## Durability profile

- Queue: durable only when Redis provider is used.
- Token store: durable with file/encrypted-file providers.
- Playback/metrics: currently process-local.
