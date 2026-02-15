# Queue Flow

## Lifecycle state machine

A job moves through these states:

1. `accepted`: API validated payload and queued it.
2. `dequeued`: worker claimed next highest-priority item.
3. `executing`: handler running.
4. `completed`: successful handler execution.
5. `retrying`: failure with attempts <= max retries.
6. `dead_lettered`: failure with attempts > max retries.

## Priority semantics

Supported priorities:

- `high`
- `normal`
- `low`

High-priority jobs are processed first. Under sustained pressure, low-priority jobs can wait longer, so producers should reserve `high` for latency-critical flows (voice update and playback start).

## Retry policy

- `MAX_JOB_RETRIES` controls retry budget.
- retries preserve original payload and increment attempt count.
- DLQ captures exhausted jobs for offline inspection/replay.

## Queue provider notes

### Memory queue

- best for local development
- no cross-process durability
- state lost on restart

### Redis queue

- required for distributed production topology
- enables cross-instance workers
- supports centralized queue depth visibility

## Operational heuristics

- rising `jobs_retried_total` with flat `jobs_completed_total` indicates dependency instability.
- rising `jobs_dead_letter_total` indicates hard failure, schema mismatch, or severe upstream issues.
