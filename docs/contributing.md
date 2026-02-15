# Contributing

## Contribution workflow

1. create a feature branch
2. make focused changes
3. run tests (`npm test`)
4. update docs when behavior/config changes
5. open PR with clear scope and rollout notes

## Documentation standards

- keep API and config pages in sync with code
- add examples for new job types
- include operational implications for runtime changes

## Testing expectations

- new runtime behavior requires test coverage
- regressions in queue/retry/routing paths are blocking issues
