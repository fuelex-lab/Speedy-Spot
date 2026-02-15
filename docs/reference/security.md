# Security Model

## Control plane security

- Set `ADMIN_API_TOKEN` in any shared or remote environment.
- Terminate TLS in front of the service.
- Restrict access to protected routes with network policy.

## Secret management

- inject secrets at runtime, do not commit them
- rotate API and provider credentials on schedule
- isolate prod/staging credentials

## Token storage guidance

- avoid `memory`/`file` in production
- use `encrypted-file` only as an interim local persistence path
- move to managed encrypted secret datastore for long-term production

## Sensitive data handling

Never expose in logs or dashboards:

- Spotify refresh tokens
- Discord voice tokens
- admin API token
- encryption keys

## Threat model notes

- static admin token is simple but coarse-grained
- future work should add scoped auth and audit trails
