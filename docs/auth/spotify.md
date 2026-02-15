# Spotify OAuth

Speedy-Spot supports Spotify token exchange, refresh, and playlist ingestion as worker jobs.

## Modes

- `SPOTIFY_MOCK_MODE=true`: local development mode without real Spotify credentials.
- `SPOTIFY_MOCK_MODE=false`: production OAuth mode with real token exchange/refresh.

## API endpoints

- `GET /auth/spotify/url?userId=<id>` builds Spotify authorize URL.
- `POST /auth/spotify/callback` exchanges auth code and stores token data.

## Required environment for real mode

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`

## Token storage options

- `memory`: ephemeral process-local state.
- `file`: persistent plaintext local file.
- `encrypted-file`: AES-GCM encrypted file storage.

For `encrypted-file`, set `TOKEN_STORE_ENCRYPTION_KEY` (32-byte base64 or 64-char hex).

## Playlist sync behavior

`spotify.playlist.sync` worker path:

1. Ensure valid access token (refresh if expired).
2. Fetch playlist tracks with pagination.
3. Retry on `429` and `5xx` with backoff.
4. Normalize track metadata for downstream use.

Retry configuration:

- `SPOTIFY_MAX_RETRIES`
- `SPOTIFY_RETRY_BASE_MS`
