import test from "node:test";
import assert from "node:assert/strict";
import { LavalinkClient } from "../src/lavalink/client.js";

test("resolveTrack returns normalized track from Lavalink", async () => {
  const fetchImpl = async () => {
    return new Response(
      JSON.stringify({
        data: [
          {
            encoded: "abc123",
            info: {
              identifier: "track-id",
              title: "Song A",
              author: "Artist A",
              uri: "https://spotify/track-id",
              length: 123000,
              sourceName: "spotify"
            }
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const client = new LavalinkClient({
    nodes: [{ id: "l1", url: "http://localhost:2333", password: "pass", sessionId: "s1" }],
    fetchImpl,
    defaultSource: "spsearch"
  });

  const resolved = await client.resolveTrack({ query: "Never Gonna Give You Up" });
  assert.equal(resolved.nodeId, "l1");
  assert.equal(resolved.query, "spsearch:Never Gonna Give You Up");
  assert.equal(resolved.track.identifier, "track-id");
});

test("resolveTrack fails over to next node", async () => {
  let call = 0;
  const fetchImpl = async () => {
    call += 1;
    if (call === 1) {
      throw new Error("first node down");
    }

    return new Response(
      JSON.stringify({
        data: [
          {
            encoded: "abc123",
            info: {
              identifier: "track-id-2",
              title: "Song B",
              author: "Artist B",
              uri: "https://spotify/track-id-2",
              length: 130000,
              sourceName: "spotify"
            }
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const client = new LavalinkClient({
    nodes: [
      { id: "l1", url: "http://node1:2333", password: "pass1", sessionId: "s1" },
      { id: "l2", url: "http://node2:2333", password: "pass2", sessionId: "s2" }
    ],
    fetchImpl,
    defaultSource: "spsearch"
  });

  const resolved = await client.resolveTrack({ query: "track", source: "ytsearch" });
  assert.equal(resolved.nodeId, "l2");
  assert.equal(resolved.query, "ytsearch:track");
});

test("resolveTrack prioritizes preferred node when provided", async () => {
  const seenHosts = [];
  const fetchImpl = async (url) => {
    seenHosts.push(new URL(url).hostname);
    return new Response(
      JSON.stringify({
        data: [
          {
            encoded: "abc123",
            info: {
              identifier: "track-id-3",
              title: "Song C",
              author: "Artist C",
              uri: "https://spotify/track-id-3",
              length: 130000,
              sourceName: "spotify"
            }
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const client = new LavalinkClient({
    nodes: [
      { id: "l1", url: "http://node1:2333", password: "pass1", sessionId: "s1" },
      { id: "l2", url: "http://node2:2333", password: "pass2", sessionId: "s2" }
    ],
    fetchImpl
  });

  const resolved = await client.resolveTrack({ query: "Song C", preferredNodeId: "l2" });
  assert.equal(resolved.nodeId, "l2");
  assert.equal(seenHosts[0], "node2");
});

test("playTrack dispatches encoded track to Lavalink player endpoint", async () => {
  let seenUrl = null;
  let seenMethod = null;
  let seenBody = null;

  const fetchImpl = async (url, options) => {
    seenUrl = String(url);
    seenMethod = options.method;
    seenBody = JSON.parse(options.body);
    return new Response(JSON.stringify({}), { status: 200 });
  };

  const client = new LavalinkClient({
    nodes: [{ id: "l1", url: "http://node1:2333", password: "pass1", sessionId: "session-1" }],
    fetchImpl
  });

  const dispatched = await client.playTrack({
    guildId: "guild-1",
    encodedTrack: "enc-track",
    noReplace: true,
    volume: 80
  });

  assert.equal(dispatched.nodeId, "l1");
  assert.equal(seenMethod, "PATCH");
  assert.match(seenUrl, /\/v4\/sessions\/session-1\/players\/guild-1\?noReplace=true$/);
  assert.equal(seenBody.track.encoded, "enc-track");
  assert.equal(seenBody.volume, 80);
});

test("updateVoiceState patches player voice payload", async () => {
  let seenUrl = null;
  let seenBody = null;

  const fetchImpl = async (url, options) => {
    seenUrl = String(url);
    seenBody = JSON.parse(options.body);
    return new Response(JSON.stringify({}), { status: 200 });
  };

  const client = new LavalinkClient({
    nodes: [{ id: "l1", url: "http://node1:2333", password: "pass1", sessionId: "session-1" }],
    fetchImpl
  });

  const updated = await client.updateVoiceState({
    guildId: "guild-1",
    sessionId: "discord-session",
    token: "voice-token",
    endpoint: "us-east.discord.media"
  });

  assert.equal(updated.nodeId, "l1");
  assert.match(seenUrl, /\/v4\/sessions\/session-1\/players\/guild-1\?noReplace=false$/);
  assert.equal(seenBody.voice.sessionId, "discord-session");
  assert.equal(seenBody.voice.token, "voice-token");
  assert.equal(seenBody.voice.endpoint, "us-east.discord.media");
});
