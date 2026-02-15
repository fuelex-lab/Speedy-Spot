# Troubleshooting

## API returns 401 for protected routes

- check `ADMIN_API_TOKEN` is set
- verify `x-api-token` header matches

## Jobs accepted but no completion growth

- inspect `/clusters` for worker status
- inspect queue depth and retries
- verify no persistent handler exceptions

## Playback dispatch not occurring

- verify voice update job is sent first
- verify lavalink node has `sessionId`
- verify playback payload has `query` or `encoded`

## Spotify callback succeeds but sync fails

- verify token store provider persistence
- verify credentials when mock mode is false
- inspect retry and failure counters
