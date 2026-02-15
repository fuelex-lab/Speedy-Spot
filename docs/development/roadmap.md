# Roadmap

## Phase A: Production queue and state

1. Redis-first deployment profile and health checks.
2. Persistent cluster/shard state snapshots.
3. DLQ replay command/API tooling.

## Phase B: Reliability and security

1. stronger auth model for control APIs (JWT/service identity)
2. secret management integration for credentials/encryption keys
3. circuit breakers and timeout budgets around upstream calls

## Phase C: Observability and operations

1. metrics export integration (Prometheus/OpenTelemetry)
2. tracing correlation IDs across producer -> queue -> worker
3. SLO dashboards and alert bundles

## Phase D: Scalability

1. adaptive worker autoscaling policies
2. weighted Lavalink routing with health score feedback
3. multi-region failover topology
