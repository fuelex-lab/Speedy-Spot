# Events and Job Types

## Job types

- `playback.enqueue`
- `spotify.playlist.sync`
- `lavalink.voice.update`

## Metrics keys

- `jobs_received_total`
- `jobs_completed_total`
- `jobs_failed_total`
- `jobs_retried_total`
- `jobs_dead_letter_total`
- `spotify_playlist_synced_total`
- `lavalink_track_resolved_total`
- `lavalink_player_dispatched_total`
- `lavalink_voice_updated_total`

## Interpretation quick guide

- rising retries with flat completions: unstable dependency path
- rising dead-letter count: persistent handler or payload failure
- voice updates rising but dispatch flat: likely voice/session mismatch
