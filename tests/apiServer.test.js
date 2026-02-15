import test from "node:test";
import assert from "node:assert/strict";
import { handleApiRequest } from "../src/api/httpServer.js";
import { JOB_TYPES } from "../src/core/events.js";

function createDeps(overrides = {}) {
  const queuedJobs = [];

  const deps = {
    config: {
      adminApiToken: "secret",
      ...overrides.config
    },
    queue: {
      async size() {
        return queuedJobs.length;
      },
      async deadLetterSize() {
        return 0;
      },
      async enqueue(job) {
        queuedJobs.push(job);
        return job;
      }
    },
    metrics: {
      snapshot() {
        return { counters: {}, gauges: {} };
      }
    },
    clusterManager: {
      snapshot() {
        return [{ id: "cluster-1", shards: [0], workers: 2, status: "healthy", lavalinkNodeIds: ["node-1"] }];
      }
    },
    spotifyService: {
      createAuthorizeUrl() {
        return { url: "https://accounts.spotify.com/authorize?x=1", state: "s1" };
      },
      async exchangeCode() {
        return { expiresAt: 123456 };
      }
    }
  };

  return { deps, queuedJobs };
}

test("health endpoint is public even when admin token is configured", async () => {
  const { deps } = createDeps();

  const result = await handleApiRequest(
    {
      method: "GET",
      url: "/health",
      headers: {}
    },
    deps
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.status, "ok");
});

test("protected endpoint requires x-api-token", async () => {
  const { deps } = createDeps();

  const unauthorized = await handleApiRequest(
    {
      method: "GET",
      url: "/metrics",
      headers: {}
    },
    deps
  );
  assert.equal(unauthorized.statusCode, 401);

  const authorized = await handleApiRequest(
    {
      method: "GET",
      url: "/metrics",
      headers: { "x-api-token": "secret" }
    },
    deps
  );
  assert.equal(authorized.statusCode, 200);
});

test("jobs endpoint rejects invalid playback payloads", async () => {
  const { deps } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/jobs",
      headers: { "x-api-token": "secret" },
      body: {
        type: JOB_TYPES.PLAYBACK_ENQUEUE,
        payload: { guildId: "guild-1" }
      }
    },
    deps
  );

  assert.equal(result.statusCode, 400);
  assert.match(result.payload.error, /requires payload\.trackId or payload\.query/);
});

test("jobs endpoint accepts playback query payload and enqueues", async () => {
  const { deps, queuedJobs } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/jobs",
      headers: { "x-api-token": "secret" },
      body: {
        type: JOB_TYPES.PLAYBACK_ENQUEUE,
        payload: { guildId: "g1", query: "song name", source: "spsearch" },
        priority: "high"
      }
    },
    deps
  );

  assert.equal(result.statusCode, 202);
  assert.equal(queuedJobs.length, 1);
  assert.equal(queuedJobs[0].payload.query, "song name");
});

test("jobs endpoint accepts voice update payload and enqueues", async () => {
  const { deps, queuedJobs } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/jobs",
      headers: { "x-api-token": "secret" },
      body: {
        type: JOB_TYPES.LAVALINK_VOICE_UPDATE,
        payload: {
          guildId: "g1",
          sessionId: "discord-session",
          token: "voice-token",
          endpoint: "us-east.discord.media",
          shardId: 4
        }
      }
    },
    deps
  );

  assert.equal(result.statusCode, 202);
  assert.equal(queuedJobs.length, 1);
  assert.equal(queuedJobs[0].type, JOB_TYPES.LAVALINK_VOICE_UPDATE);
});

test("jobs endpoint rejects invalid voice update payload", async () => {
  const { deps } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/jobs",
      headers: { "x-api-token": "secret" },
      body: {
        type: JOB_TYPES.LAVALINK_VOICE_UPDATE,
        payload: {
          guildId: "g1",
          sessionId: "discord-session"
        }
      }
    },
    deps
  );

  assert.equal(result.statusCode, 400);
  assert.match(result.payload.error, /requires payload\.guildId, payload\.sessionId, payload\.token, and payload\.endpoint/);
});

test("jobs endpoint accepts valid spotify sync payload and enqueues", async () => {
  const { deps, queuedJobs } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/jobs",
      headers: { "x-api-token": "secret" },
      body: {
        type: JOB_TYPES.SPOTIFY_PLAYLIST_SYNC,
        payload: { userId: "u1", playlistId: "p1" },
        priority: "high"
      }
    },
    deps
  );

  assert.equal(result.statusCode, 202);
  assert.equal(queuedJobs.length, 1);
  assert.equal(queuedJobs[0].type, JOB_TYPES.SPOTIFY_PLAYLIST_SYNC);
  assert.equal(queuedJobs[0].priority, "high");
});

test("spotify callback remains public", async () => {
  const { deps } = createDeps();

  const result = await handleApiRequest(
    {
      method: "POST",
      url: "/auth/spotify/callback",
      headers: {},
      body: { userId: "u1", code: "abc" }
    },
    deps
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.ok, true);
});
