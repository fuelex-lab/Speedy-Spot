# FAQ

## Why do playback jobs fail even when query resolve works?

Most common reason is missing or stale voice state. Ensure `lavalink.voice.update` is sent before dispatch attempts.

## Do I need Redis?

For real multi-instance usage, yes. Memory queue is local-only and not durable across processes.

## Can I run without Lavalink?

You can run Spotify and queue paths, but playback query/dispatch features require Lavalink configuration.

## Is encrypted-file token store production-safe?

It is safer than plaintext file but still local-disk based. Use managed encrypted storage for long-term production.

## Why include shardId in payloads?

It improves deterministic routing for Lavalink node preference and reduces noisy cross-node fallback.
