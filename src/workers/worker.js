import { JOB_TYPES, METRIC_KEYS } from "../core/events.js";

export class Worker {
  constructor({ id, clusterId, queue, playbackCoordinator, spotifyService, lavalinkClient, lavalinkRouter, metrics, logger }) {
    this.id = id;
    this.clusterId = clusterId;
    this.queue = queue;
    this.playbackCoordinator = playbackCoordinator;
    this.spotifyService = spotifyService;
    this.lavalinkClient = lavalinkClient;
    this.lavalinkRouter = lavalinkRouter;
    this.metrics = metrics;
    this.logger = logger;
    this.running = false;
  }

  async process(job) {
    switch (job.type) {
      case JOB_TYPES.SPOTIFY_PLAYLIST_SYNC:
        await this.handleSpotifyPlaylistSync(job.payload);
        return;
      case JOB_TYPES.PLAYBACK_ENQUEUE:
        await this.handlePlaybackEnqueue(job.payload);
        return;
      case JOB_TYPES.LAVALINK_VOICE_UPDATE:
        await this.handleLavalinkVoiceUpdate(job.payload);
        return;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  async handleSpotifyPlaylistSync(payload) {
    const tracks = await this.spotifyService.fetchPlaylistTracks({
      userId: payload.userId,
      playlistId: payload.playlistId,
      pageLimit: payload.pageLimit ?? 100,
      maxTracks: payload.maxTracks ?? 500
    });

    this.metrics.increment(METRIC_KEYS.SPOTIFY_PLAYLIST_SYNCED);
    this.logger.info("spotify playlist sync executed", {
      workerId: this.id,
      userId: payload.userId,
      playlistId: payload.playlistId,
      trackCount: tracks.length,
      sampleTrack: tracks[0]?.name ?? null
    });
  }

  async handlePlaybackEnqueue(payload) {
    const locked = this.playbackCoordinator.acquire(payload.guildId);
    if (!locked) {
      throw new Error(`Guild ${payload.guildId} is already processing playback`);
    }

    try {
      const preferredNodeId = this.lavalinkRouter?.resolvePreferredNodeId({
        guildId: payload.guildId,
        shardId: payload.shardId
      });

      let trackState = {
        trackId: payload.trackId ?? null,
        encoded: payload.encoded ?? null,
        shardId: payload.shardId ?? null,
        clusterId: this.clusterId
      };

      if (payload.query) {
        if (!this.lavalinkClient || !this.lavalinkClient.isConfigured()) {
          throw new Error("Lavalink query provided but Lavalink is not configured");
        }

        const resolved = await this.lavalinkClient.resolveTrack({
          query: payload.query,
          source: payload.source,
          preferredNodeId
        });

        trackState = {
          trackId: resolved.track.identifier,
          encoded: resolved.track.encoded,
          title: resolved.track.title,
          author: resolved.track.author,
          uri: resolved.track.uri,
          length: resolved.track.length,
          sourceName: resolved.track.sourceName,
          nodeId: resolved.nodeId,
          query: resolved.query,
          shardId: payload.shardId ?? null,
          clusterId: this.clusterId
        };

        this.metrics.increment(METRIC_KEYS.LAVALINK_TRACK_RESOLVED);
      }

      const dispatchEnabled = payload.dispatchToLavalink !== false;
      if (dispatchEnabled && trackState.encoded && this.lavalinkClient?.isConfigured()) {
        const dispatched = await this.lavalinkClient.playTrack({
          guildId: payload.guildId,
          encodedTrack: trackState.encoded,
          preferredNodeId: trackState.nodeId ?? preferredNodeId,
          noReplace: payload.noReplace ?? true,
          pause: payload.pause,
          volume: payload.volume,
          position: payload.position
        });

        trackState.nodeId = dispatched.nodeId;
        trackState.dispatched = true;
        this.metrics.increment(METRIC_KEYS.LAVALINK_PLAYER_DISPATCHED);
      } else {
        trackState.dispatched = false;
      }

      this.playbackCoordinator.mergeState(payload.guildId, {
        ...trackState,
        enqueuedAt: Date.now()
      });
    } finally {
      this.playbackCoordinator.release(payload.guildId);
    }
  }

  async handleLavalinkVoiceUpdate(payload) {
    const locked = this.playbackCoordinator.acquire(payload.guildId);
    if (!locked) {
      throw new Error(`Guild ${payload.guildId} is already processing voice update`);
    }

    try {
      if (!this.lavalinkClient || !this.lavalinkClient.isConfigured()) {
        throw new Error("Lavalink voice update provided but Lavalink is not configured");
      }

      const preferredNodeId = this.lavalinkRouter?.resolvePreferredNodeId({
        guildId: payload.guildId,
        shardId: payload.shardId
      });

      const updated = await this.lavalinkClient.updateVoiceState({
        guildId: payload.guildId,
        sessionId: payload.sessionId,
        token: payload.token,
        endpoint: payload.endpoint,
        preferredNodeId
      });

      this.playbackCoordinator.mergeState(payload.guildId, {
        voiceSessionId: payload.sessionId,
        voiceEndpoint: payload.endpoint,
        voiceToken: payload.token,
        nodeId: updated.nodeId,
        shardId: payload.shardId ?? null,
        clusterId: this.clusterId,
        voiceUpdatedAt: Date.now()
      });

      this.metrics.increment(METRIC_KEYS.LAVALINK_VOICE_UPDATED);
    } finally {
      this.playbackCoordinator.release(payload.guildId);
    }
  }

  async tick() {
    const job = await this.queue.dequeue();
    if (!job) {
      return false;
    }

    try {
      await this.process(job);
      this.metrics.increment(METRIC_KEYS.JOB_COMPLETED);
    } catch (error) {
      this.metrics.increment(METRIC_KEYS.JOB_FAILED);
      this.logger.warn("job execution failed", {
        workerId: this.id,
        jobType: job.type,
        error: error.message
      });
      await this.queue.requeue(job);
    }

    return true;
  }

  start(intervalMs = 25) {
    if (this.running) {
      return;
    }

    this.running = true;
    const loop = async () => {
      if (!this.running) {
        return;
      }
      await this.tick();
      setTimeout(loop, intervalMs);
    };
    setTimeout(loop, intervalMs);
  }

  stop() {
    this.running = false;
  }
}
