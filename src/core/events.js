export const JOB_TYPES = {
  SPOTIFY_PLAYLIST_SYNC: "spotify.playlist.sync",
  PLAYBACK_ENQUEUE: "playback.enqueue",
  LAVALINK_VOICE_UPDATE: "lavalink.voice.update"
};

export const METRIC_KEYS = {
  JOB_RECEIVED: "jobs_received_total",
  JOB_COMPLETED: "jobs_completed_total",
  JOB_FAILED: "jobs_failed_total",
  JOB_RETRIED: "jobs_retried_total",
  JOB_DLQ: "jobs_dead_letter_total",
  SPOTIFY_PLAYLIST_SYNCED: "spotify_playlist_synced_total",
  LAVALINK_TRACK_RESOLVED: "lavalink_track_resolved_total",
  LAVALINK_PLAYER_DISPATCHED: "lavalink_player_dispatched_total",
  LAVALINK_VOICE_UPDATED: "lavalink_voice_updated_total"
};
