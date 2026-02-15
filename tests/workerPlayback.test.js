import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "../src/workers/worker.js";
import { JOB_TYPES, METRIC_KEYS } from "../src/core/events.js";
import { PlaybackCoordinator } from "../src/playback/playbackCoordinator.js";
import { InMemoryMetrics } from "../src/telemetry/metrics.js";

test("worker resolves playback query through Lavalink with router preference and dispatches", async () => {
  const queue = {
    async dequeue() {
      return null;
    },
    async requeue() {}
  };

  let preferredNodeInResolve = null;
  let preferredNodeInPlay = null;

  const worker = new Worker({
    id: "cluster-1-worker-1",
    clusterId: "cluster-1",
    queue,
    playbackCoordinator: new PlaybackCoordinator(),
    spotifyService: {
      async fetchPlaylistTracks() {
        return [];
      }
    },
    lavalinkClient: {
      isConfigured() {
        return true;
      },
      async resolveTrack(input) {
        preferredNodeInResolve = input.preferredNodeId;
        return {
          nodeId: "node-1",
          query: "spsearch:Song A",
          track: {
            encoded: "enc",
            identifier: "id-1",
            title: "Song A",
            author: "Artist A",
            uri: "http://x",
            length: 123000,
            sourceName: "spotify"
          }
        };
      },
      async playTrack(input) {
        preferredNodeInPlay = input.preferredNodeId;
        return { nodeId: "node-1", guildId: input.guildId };
      }
    },
    lavalinkRouter: {
      resolvePreferredNodeId() {
        return "node-1";
      }
    },
    metrics: new InMemoryMetrics(),
    logger: {
      info() {},
      warn() {}
    }
  });

  await worker.process({
    type: JOB_TYPES.PLAYBACK_ENQUEUE,
    payload: {
      guildId: "g1",
      query: "Song A",
      source: "spsearch",
      shardId: 2
    }
  });

  const state = worker.playbackCoordinator.getState("g1");
  assert.equal(state.trackId, "id-1");
  assert.equal(state.nodeId, "node-1");
  assert.equal(state.clusterId, "cluster-1");
  assert.equal(state.dispatched, true);
  assert.equal(preferredNodeInResolve, "node-1");
  assert.equal(preferredNodeInPlay, "node-1");

  const counters = worker.metrics.snapshot().counters;
  assert.equal(counters[METRIC_KEYS.LAVALINK_TRACK_RESOLVED], 1);
  assert.equal(counters[METRIC_KEYS.LAVALINK_PLAYER_DISPATCHED], 1);
});

test("worker updates Lavalink voice state and stores voice metadata", async () => {
  const queue = {
    async dequeue() {
      return null;
    },
    async requeue() {}
  };

  let preferredNodeInVoice = null;

  const worker = new Worker({
    id: "cluster-1-worker-2",
    clusterId: "cluster-1",
    queue,
    playbackCoordinator: new PlaybackCoordinator(),
    spotifyService: {
      async fetchPlaylistTracks() {
        return [];
      }
    },
    lavalinkClient: {
      isConfigured() {
        return true;
      },
      async updateVoiceState(input) {
        preferredNodeInVoice = input.preferredNodeId;
        return { nodeId: "node-2", guildId: input.guildId };
      }
    },
    lavalinkRouter: {
      resolvePreferredNodeId() {
        return "node-2";
      }
    },
    metrics: new InMemoryMetrics(),
    logger: {
      info() {},
      warn() {}
    }
  });

  await worker.process({
    type: JOB_TYPES.LAVALINK_VOICE_UPDATE,
    payload: {
      guildId: "g1",
      shardId: 4,
      sessionId: "discord-session",
      token: "voice-token",
      endpoint: "us-east.discord.media"
    }
  });

  const state = worker.playbackCoordinator.getState("g1");
  assert.equal(state.nodeId, "node-2");
  assert.equal(state.voiceSessionId, "discord-session");
  assert.equal(state.clusterId, "cluster-1");
  assert.equal(preferredNodeInVoice, "node-2");

  const counters = worker.metrics.snapshot().counters;
  assert.equal(counters[METRIC_KEYS.LAVALINK_VOICE_UPDATED], 1);
});
