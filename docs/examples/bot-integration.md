# Bot Integration Example

## Typical Discord event pipeline

1. User authenticates Spotify.
2. Bot enqueues playlist sync job.
3. Bot receives Discord voice updates and enqueues `lavalink.voice.update`.
4. Bot enqueues `playback.enqueue` with query or encoded track.
5. Worker resolves and dispatches track.

## Producer recommendation

- use `high` priority for voice update and playback jobs
- include `shardId` whenever possible
- include correlation IDs in producer logs for traceability

## Example producer call (curl)

```bash
curl -X POST http://localhost:3000/jobs \
  -H 'content-type: application/json' \
  -H 'x-api-token: dev-token' \
  -d '{
    "type": "playback.enqueue",
    "priority": "high",
    "payload": {
      "guildId": "123",
      "query": "Numb Linkin Park",
      "source": "spsearch",
      "shardId": 2
    }
  }'
```
