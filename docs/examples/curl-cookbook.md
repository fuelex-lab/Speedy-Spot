# cURL Cookbook

## Health

```bash
curl http://localhost:3000/health
```

## Metrics

```bash
curl -H 'x-api-token: dev-token' http://localhost:3000/metrics
```

## Cluster snapshot

```bash
curl -H 'x-api-token: dev-token' http://localhost:3000/clusters
```

## Spotify authorize URL

```bash
curl -H 'x-api-token: dev-token' \
  'http://localhost:3000/auth/spotify/url?userId=user-1'
```

## Voice update job

```bash
curl -X POST http://localhost:3000/jobs \
  -H 'content-type: application/json' \
  -H 'x-api-token: dev-token' \
  -d '{
    "type": "lavalink.voice.update",
    "priority": "high",
    "payload": {
      "guildId": "123",
      "sessionId": "discord-session-id",
      "token": "voice-token",
      "endpoint": "us-east.discord.media"
    }
  }'
```
