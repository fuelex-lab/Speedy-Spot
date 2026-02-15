# Metrics Guide

## Queue health

- `jobs_received_total`: ingress volume
- `jobs_retried_total`: transient errors
- `jobs_dead_letter_total`: hard failure pressure

## Execution health

- `jobs_completed_total`: throughput
- `jobs_failed_total`: execution failures

## Spotify domain

- `spotify_playlist_synced_total`: successful playlist sync jobs

## Lavalink domain

- `lavalink_track_resolved_total`: successful query resolutions
- `lavalink_player_dispatched_total`: successful player dispatches
- `lavalink_voice_updated_total`: successful voice patches

## Useful ratios

- fail ratio: `jobs_failed_total / jobs_completed_total`
- retry pressure: `jobs_retried_total / jobs_received_total`
- dispatch readiness: `lavalink_player_dispatched_total / lavalink_voice_updated_total`
