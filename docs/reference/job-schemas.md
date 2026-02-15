# Job Schemas

This page contains canonical payload schemas for producer integrations.

## playback.enqueue

```json
{
  "type": "playback.enqueue",
  "priority": "high",
  "payload": {
    "guildId": "123",
    "query": "Daft Punk - One More Time",
    "source": "spsearch",
    "shardId": 5,
    "dispatchToLavalink": true,
    "noReplace": true,
    "volume": 75
  }
}
```

## spotify.playlist.sync

```json
{
  "type": "spotify.playlist.sync",
  "priority": "normal",
  "payload": {
    "userId": "user-1",
    "playlistId": "37i9dQZF1DXcBWIGoYBM5M",
    "pageLimit": 100,
    "maxTracks": 500
  }
}
```

## lavalink.voice.update

```json
{
  "type": "lavalink.voice.update",
  "priority": "high",
  "payload": {
    "guildId": "123",
    "sessionId": "discord-session-id",
    "token": "voice-token",
    "endpoint": "us-east.discord.media",
    "shardId": 5
  }
}
```
