# Bot Integration Example

Typical flow:

1. User logs in with Spotify and callback stores session.
2. Bot requests playlist sync by enqueueing `spotify.playlist.sync`.
3. Worker processes sync and enriches track metadata.
4. Playback enqueue jobs are scheduled per guild.

This reference implementation is intentionally lightweight and is meant to be extended for production.
