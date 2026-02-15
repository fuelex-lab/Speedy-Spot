const TOKEN_URL = "https://accounts.spotify.com/api/token";
const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const PLAYLIST_URL = "https://api.spotify.com/v1/playlists";

function encodeBasicAuth(clientId, clientSecret) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

function normalizeTrackItem(item) {
  const track = item?.track ?? {};
  return {
    id: track.id ?? null,
    name: track.name ?? "unknown",
    durationMs: track.duration_ms ?? 0,
    artists: Array.isArray(track.artists) ? track.artists.map((a) => a.name) : [],
    album: track.album?.name ?? "unknown",
    uri: track.uri ?? null
  };
}

function isRetryable(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

function parseRetryAfterMs(response, fallbackMs) {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) {
    return fallbackMs;
  }
  const retrySeconds = Number.parseInt(retryAfter, 10);
  if (Number.isNaN(retrySeconds) || retrySeconds < 0) {
    return fallbackMs;
  }
  return retrySeconds * 1000;
}

export class SpotifyService {
  constructor({ config, tokenStore, fetchImpl = fetch, sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this.config = config;
    this.tokenStore = tokenStore;
    this.fetchImpl = fetchImpl;
    this.sleepImpl = sleepImpl;
  }

  createAuthorizeUrl({ userId, state, scope }) {
    if (!userId) {
      throw new Error("userId is required");
    }

    const authState = state ?? `${userId}:${crypto.randomUUID()}`;
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("scope", scope ?? this.config.scopes);
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("state", authState);

    return {
      url: url.toString(),
      state: authState
    };
  }

  async exchangeCode({ userId, code }) {
    if (!userId || !code) {
      throw new Error("userId and code are required");
    }

    if (this.config.mockMode) {
      const token = {
        accessToken: `spotify_access_${code}`,
        refreshToken: `spotify_refresh_${code}`,
        expiresAt: Date.now() + 60 * 60 * 1000
      };
      await this.tokenStore.set(userId, token);
      return token;
    }

    this.#assertCredentials();

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri
    });

    const response = await this.#fetchWithRetry(TOKEN_URL, {
      method: "POST",
      headers: {
        authorization: `Basic ${encodeBasicAuth(this.config.clientId, this.config.clientSecret)}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Spotify token exchange failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000
    };

    await this.tokenStore.set(userId, token);
    return token;
  }

  async getValidAccessToken(userId) {
    const token = await this.tokenStore.get(userId);
    if (!token) {
      throw new Error(`No Spotify session for user ${userId}`);
    }

    if (token.expiresAt <= Date.now()) {
      await this.#refreshToken(userId, token.refreshToken);
    }

    const updated = await this.tokenStore.get(userId);
    return updated.accessToken;
  }

  async fetchPlaylistTracks({ userId, playlistId, pageLimit = 100, maxTracks = 500 }) {
    if (!playlistId) {
      throw new Error("playlistId is required");
    }

    if (this.config.mockMode) {
      return [
        {
          id: "mock_track_1",
          name: "Mock Track",
          durationMs: 180000,
          artists: ["Mock Artist"],
          album: "Mock Album",
          uri: "spotify:track:mock_track_1"
        }
      ];
    }

    const accessToken = await this.getValidAccessToken(userId);
    const safePageLimit = Math.max(1, Math.min(100, pageLimit));
    let nextUrl = new URL(`${PLAYLIST_URL}/${playlistId}/tracks`);
    nextUrl.searchParams.set("limit", String(safePageLimit));
    nextUrl.searchParams.set("market", "from_token");

    const tracks = [];
    while (nextUrl && tracks.length < maxTracks) {
      const response = await this.#fetchWithRetry(nextUrl, {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Spotify playlist fetch failed (${response.status}): ${detail}`);
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      for (const item of items) {
        const normalized = normalizeTrackItem(item);
        if (normalized.id) {
          tracks.push(normalized);
        }
        if (tracks.length >= maxTracks) {
          break;
        }
      }

      nextUrl = data.next ? new URL(data.next) : null;
    }

    return tracks;
  }

  async #refreshToken(userId, refreshToken) {
    if (this.config.mockMode) {
      const current = await this.tokenStore.get(userId);
      const updated = {
        ...current,
        accessToken: `${current.accessToken}_refreshed`,
        expiresAt: Date.now() + 60 * 60 * 1000
      };
      await this.tokenStore.set(userId, updated);
      return;
    }

    this.#assertCredentials();

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });

    const response = await this.#fetchWithRetry(TOKEN_URL, {
      method: "POST",
      headers: {
        authorization: `Basic ${encodeBasicAuth(this.config.clientId, this.config.clientSecret)}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Spotify token refresh failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const current = await this.tokenStore.get(userId);
    await this.tokenStore.set(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
      expiresAt: Date.now() + Number(data.expires_in) * 1000
    });
  }

  async #fetchWithRetry(url, options) {
    let attempt = 0;
    while (attempt <= this.config.maxRetries) {
      const response = await this.fetchImpl(url, options);
      if (response.ok || !isRetryable(response.status) || attempt === this.config.maxRetries) {
        return response;
      }

      const backoff = this.config.retryBaseMs * 2 ** attempt;
      const waitMs = parseRetryAfterMs(response, backoff);
      await this.sleepImpl(waitMs);
      attempt += 1;
    }

    throw new Error("Spotify retry loop exhausted unexpectedly");
  }

  #assertCredentials() {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
      throw new Error("Spotify credentials are required when SPOTIFY_MOCK_MODE=false");
    }
  }
}
