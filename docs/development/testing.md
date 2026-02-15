# Testing Strategy

## Current test layers

- API request-path validation tests
- queue behavior tests (priority, retry, DLQ)
- cluster and routing assignment tests
- Spotify service retry/pagination tests
- Lavalink client resolve/dispatch/voice patch tests
- worker playback and voice handler tests

## Running tests

```bash
npm test
```

## What to test when modifying modules

Queue changes:

- priority ordering
- retry transition
- dead-letter transition

Worker changes:

- handler success/failure behavior
- playback state merge semantics
- metrics increments

Lavalink changes:

- preferred-node routing
- failover behavior
- payload shape for player patch

Spotify changes:

- refresh behavior
- pagination and max track bounds
- retry handling for 429/5xx

## Gaps to add later

- end-to-end integration suite with live Redis + Lavalink in CI
- load-test harness for queue pressure behavior
