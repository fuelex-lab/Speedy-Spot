# Spotify OAuth

Speedy-Spot supports two Spotify modes:

- Mock mode (`SPOTIFY_MOCK_MODE=true`) for local development without Spotify credentials
- Real mode (`SPOTIFY_MOCK_MODE=false`) for production OAuth exchange and refresh

## Endpoints

- `GET /auth/spotify/url?userId=<id>` generates Spotify authorize URL
- `POST /auth/spotify/callback` exchanges code and stores token state

## Required env in real mode

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`

## Token storage providers

- `TOKEN_STORE_PROVIDER=memory` for dev/test
- `TOKEN_STORE_PROVIDER=file` for persistent local runtime
- `TOKEN_STORE_PROVIDER=encrypted-file` for encrypted-at-rest local persistence

For `encrypted-file` you must set `TOKEN_STORE_ENCRYPTION_KEY`.

## Playlist sync pipeline

`spotify.playlist.sync` jobs fetch playlist tracks with pagination and retry/backoff behavior.

Retry behavior:

- Retries on `429` and `5xx`
- Honors `Retry-After` when present
- Falls back to exponential backoff based on `SPOTIFY_RETRY_BASE_MS`
