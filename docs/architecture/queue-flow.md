# Queue Flow

## Lifecycle

1. API receives a job payload via `POST /jobs`.
2. Queue stores job with priority (`high`, `normal`, `low`).
3. Worker dequeues and executes handler.
4. Failure triggers retry until `MAX_JOB_RETRIES`.
5. Exhausted jobs move to dead-letter queue.

## Guarantees

- Priority-first dequeueing.
- Bounded retries.
- Dead-letter visibility through metrics.
