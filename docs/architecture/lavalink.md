# Lavalink Integration

Speedy-Spot integrates Lavalink for both playback and voice readiness.

## Supported actions

- query resolution (`/v4/loadtracks`)
- voice state patch (`/v4/sessions/{sessionId}/players/{guildId}`)
- encoded track dispatch (same player patch endpoint)

## Voice + playback ordering

Recommended sequence per guild:

1. receive Discord voice-server/session update
2. enqueue `lavalink.voice.update`
3. enqueue `playback.enqueue` (query or encoded)
4. worker resolves query when needed
5. worker dispatches encoded track

Dispatch before voice readiness can fail, so producers should prioritize voice updates.

## Node requirements

Each `LAVALINK_NODES` item should include:

- `id`
- `url`
- `password`
- `sessionId`

Without `sessionId`, resolve can work but player/voice patch operations cannot execute on that node.

## Routing behavior

- cluster manager assigns node IDs to clusters
- router selects preferred node by shard or guild hash
- client attempts preferred node first
- client falls back automatically on error/non-2xx/no-result

## Failure scenarios

- node unavailable: fallback path activates
- all nodes failing: worker throws; queue retry policy handles reattempt
- missing voice state: player dispatch may fail repeatedly until voice update succeeds

## Practical producer guidance

- send `shardId` whenever available
- send voice update as `high` priority
- keep playback job payload minimal and deterministic
