import test from "node:test";
import assert from "node:assert/strict";
import { SpotifyService } from "../src/auth/spotifyService.js";
import { InMemoryTokenStore } from "../src/auth/tokenStore.js";

function createConfig(overrides = {}) {
  return {
    clientId: "cid",
    clientSecret: "secret",
    redirectUri: "http://localhost:3000/auth/spotify/callback",
    scopes: "playlist-read-private",
    mockMode: false,
    maxRetries: 3,
    retryBaseMs: 10,
    ...overrides
  };
}

test("createAuthorizeUrl builds spotify authorize URL", () => {
  const service = new SpotifyService({
    config: createConfig({ mockMode: true }),
    tokenStore: new InMemoryTokenStore()
  });

  const auth = service.createAuthorizeUrl({ userId: "u1", state: "s1" });
  const parsed = new URL(auth.url);

  assert.equal(parsed.hostname, "accounts.spotify.com");
  assert.equal(parsed.searchParams.get("client_id"), "cid");
  assert.equal(parsed.searchParams.get("state"), "s1");
});

test("exchangeCode and refresh works in real mode with mocked fetch", async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        JSON.stringify({ access_token: "access_1", refresh_token: "refresh_1", expires_in: 1 }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ access_token: "access_2", expires_in: 3600 }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const service = new SpotifyService({
    config: createConfig(),
    tokenStore: new InMemoryTokenStore(),
    fetchImpl
  });

  await service.exchangeCode({ userId: "u1", code: "abc" });

  const tokenOne = await service.getValidAccessToken("u1");
  assert.equal(tokenOne, "access_1");

  await new Promise((resolve) => setTimeout(resolve, 1100));
  const tokenTwo = await service.getValidAccessToken("u1");
  assert.equal(tokenTwo, "access_2");
});

test("fetchPlaylistTracks paginates and normalizes tracks", async () => {
  const responses = [
    new Response(
      JSON.stringify({ access_token: "access_1", refresh_token: "refresh_1", expires_in: 3600 }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
    new Response(
      JSON.stringify({
        items: [
          {
            track: {
              id: "track_1",
              name: "Song A",
              duration_ms: 123000,
              artists: [{ name: "Artist A" }],
              album: { name: "Album A" },
              uri: "spotify:track:track_1"
            }
          }
        ],
        next: "https://api.spotify.com/v1/playlists/pl1/tracks?offset=1&limit=1"
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
    new Response(
      JSON.stringify({
        items: [
          {
            track: {
              id: "track_2",
              name: "Song B",
              duration_ms: 130000,
              artists: [{ name: "Artist B" }],
              album: { name: "Album B" },
              uri: "spotify:track:track_2"
            }
          }
        ],
        next: null
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  ];

  const fetchImpl = async () => responses.shift();

  const service = new SpotifyService({
    config: createConfig(),
    tokenStore: new InMemoryTokenStore(),
    fetchImpl
  });

  await service.exchangeCode({ userId: "u1", code: "abc" });
  const tracks = await service.fetchPlaylistTracks({ userId: "u1", playlistId: "pl1", pageLimit: 1, maxTracks: 10 });

  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].id, "track_1");
  assert.equal(tracks[1].id, "track_2");
});

test("fetchPlaylistTracks retries on rate limit", async () => {
  const sleepCalls = [];
  const responses = [
    new Response(
      JSON.stringify({ access_token: "access_1", refresh_token: "refresh_1", expires_in: 3600 }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
    new Response("rate limited", { status: 429, headers: { "retry-after": "1" } }),
    new Response(
      JSON.stringify({ items: [], next: null }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  ];

  const fetchImpl = async () => responses.shift();

  const service = new SpotifyService({
    config: createConfig(),
    tokenStore: new InMemoryTokenStore(),
    fetchImpl,
    sleepImpl: async (ms) => {
      sleepCalls.push(ms);
    }
  });

  await service.exchangeCode({ userId: "u1", code: "abc" });
  await service.fetchPlaylistTracks({ userId: "u1", playlistId: "pl1" });

  assert.equal(sleepCalls.length, 1);
  assert.equal(sleepCalls[0], 1000);
});
