# Failure Modes

## Queue overload

Indicators:

- queue depth rising over multiple windows
- completion rate lower than ingress rate

Mitigation:

- add workers/clusters
- move to Redis queue
- reduce non-critical high-priority job volume

## Validation rejection storm

Indicators:

- high API 400 rate
- low queue ingress

Mitigation:

- fix producer schema
- enforce producer-side schema validation
- add canary producer tests

## Lavalink partial outage

Indicators:

- resolve or dispatch counters flatten
- retries and failures increase

Mitigation:

- remove unhealthy nodes from config
- verify per-node session IDs
- prioritize voice update jobs

## Spotify upstream instability

Indicators:

- playlist sync success drops
- retries spike on spotify jobs

Mitigation:

- tune retry budget and backoff
- verify token freshness and OAuth callback integrity
- add temporary rate controls on producer side
