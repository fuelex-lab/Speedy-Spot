# Reliability

Current reliability features:

- Retry attempts up to `MAX_JOB_RETRIES`
- Dead-letter queue capture for failed jobs
- Queue provider abstraction for in-memory or Redis-backed transport
- Cluster health snapshot available via metrics and clusters endpoints

Recommended production additions:

- Circuit breakers for external API calls
- Persistent session store for Spotify tokens
- Automated worker restart and exponential backoff policies
