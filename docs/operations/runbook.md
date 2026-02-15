# Runbook

## 1. Queue backlog growth

Symptoms:

- increasing `queueDepth`
- flat `jobs_completed_total`
- rising retry/failure counts

Actions:

1. check `/clusters` for stopped clusters
2. inspect recent deployment/config changes
3. increase workers or clusters incrementally
4. move to Redis if still on memory queue

## 2. Lavalink dispatch failures

Symptoms:

- `lavalink_track_resolved_total` increases
- `lavalink_player_dispatched_total` stagnates

Actions:

1. verify node `sessionId` values
2. verify `lavalink.voice.update` is being produced
3. inspect node health and credentials
4. drain traffic away from failing nodes

## 3. Voice update failures

Symptoms:

- `lavalink_voice_updated_total` flat while playback jobs arrive

Actions:

1. verify payload fields: `guildId`, `sessionId`, `token`, `endpoint`
2. verify discord voice events are forwarded correctly
3. ensure voice jobs are high priority

## 4. Spotify sync failures

Symptoms:

- sync counter stagnates
- failure/retry counters rise

Actions:

1. confirm credential mode (`SPOTIFY_MOCK_MODE`)
2. validate callback flow and token storage
3. adjust retry parameters cautiously
