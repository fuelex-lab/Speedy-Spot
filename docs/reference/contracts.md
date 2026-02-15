# Contracts and Compatibility

## API contract stability

- additive fields are preferred over breaking changes
- required field removals or type changes are breaking
- job type semantics should be versioned if changed materially

## Producer contract expectations

- producer sends valid JSON payload shape
- producer chooses priority intentionally
- producer retries at transport layer only when request was not accepted

## Backward compatibility practice

- introduce new optional fields first
- keep old fields accepted during migration window
- deprecate with explicit docs and timeline
