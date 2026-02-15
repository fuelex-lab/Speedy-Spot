# Scaling

Scaling Speedy-Spot should be done with measured iteration.

## Core scaling knobs

- `CLUSTER_COUNT`
- `WORKERS_PER_CLUSTER`
- `QUEUE_PROVIDER` + Redis capacity
- Lavalink node count and capacity

## Step-by-step scaling approach

1. Capture baseline metrics and queue depth trends.
2. Increase workers per cluster.
3. Re-measure completion/failure/retry rates.
4. Increase cluster count if shard pressure remains high.
5. Add Lavalink nodes if dispatch/resolve bottlenecks persist.

## Capacity signals

Scale up when:

- queue depth trend is continuously positive
- retries rise with no completion improvement
- voice updates or dispatch counters lag ingress volume

Scale down only after sustained stable windows.
