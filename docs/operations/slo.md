# SLO and Alerting

## Suggested SLO candidates

- Job success ratio over rolling window.
- Queue latency from enqueue to completion.
- Playback readiness ratio (voice updates before dispatch).

## Suggested alerts

### Critical

- dead-letter growth above threshold for sustained period
- failures/completions ratio above threshold

### Warning

- retry ratio spikes above baseline
- queue depth trend positive for sustained period
- dispatch-to-voice ratio degrades

## Dashboard sections

1. ingress and completion trends
2. retry/failure/dead-letter trends
3. spotify sync outcomes
4. lavalink resolve/voice/dispatch outcomes
5. cluster snapshot panel
