# Extending Speedy-Spot

## Add a new job type

1. Add type constant in `src/core/events.js`.
2. Add API validation branch in `src/api/httpServer.js`.
3. Implement worker handler in `src/workers/worker.js`.
4. Emit relevant metrics.
5. Add tests for API + worker + integration path.
6. Update docs (`reference/api`, `reference/events`, examples).

## Add a new queue provider

1. Implement queue adapter with methods:

- `enqueue`
- `dequeue`
- `requeue`
- `size`
- `deadLetterSize`
- optional `close`

2. Register provider in `src/queue/createQueue.js`.
3. Add provider-specific tests.
4. Document config variables and caveats.

## Add a new token store provider

1. Implement provider contract in `src/auth/tokenStore.js` style.
2. Add selector in `src/auth/createTokenStore.js`.
3. Add migration/compatibility notes.
4. Add security notes if provider stores secrets.
