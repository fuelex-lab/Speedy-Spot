const DEFAULTS = {
  NODE_ENV: "development",
  PORT: "3000",
  CLUSTER_COUNT: "2",
  WORKERS_PER_CLUSTER: "2",
  SHARD_COUNT: "8",
  MAX_JOB_RETRIES: "3",
  QUEUE_PROVIDER: "memory",
  REDIS_URL: "redis://localhost:6379",
  REDIS_KEY_PREFIX: "speedyspot",
  TOKEN_STORE_PROVIDER: "memory",
  TOKEN_STORE_FILE: "./.speedyspot-tokens.json",
  TOKEN_STORE_ENCRYPTION_KEY: "",
  ADMIN_API_TOKEN: "",
  SPOTIFY_REDIRECT_URI: "http://localhost:3000/auth/spotify/callback",
  SPOTIFY_SCOPES: "playlist-read-private playlist-read-collaborative",
  SPOTIFY_MOCK_MODE: "true",
  SPOTIFY_MAX_RETRIES: "3",
  SPOTIFY_RETRY_BASE_MS: "300",
  LAVALINK_NODES: "[]",
  LAVALINK_DEFAULT_SOURCE: "spsearch"
};

function readInt(name) {
  const raw = process.env[name] ?? DEFAULTS[name];
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 1) {
    throw new Error(`Invalid integer env var ${name}: ${raw}`);
  }
  return value;
}

function readString(name) {
  return process.env[name] ?? DEFAULTS[name] ?? "";
}

function readBoolean(name) {
  const raw = (process.env[name] ?? DEFAULTS[name] ?? "false").toLowerCase();
  return raw === "true" || raw === "1";
}

function readLavalinkNodes() {
  const rawJson = process.env.LAVALINK_NODES ?? DEFAULTS.LAVALINK_NODES;
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    throw new Error("Invalid LAVALINK_NODES JSON format");
  }

  throw new Error("LAVALINK_NODES must be a JSON array");
}

export function loadConfig() {
  return {
    nodeEnv: readString("NODE_ENV"),
    port: readInt("PORT"),
    clusterCount: readInt("CLUSTER_COUNT"),
    workersPerCluster: readInt("WORKERS_PER_CLUSTER"),
    shardCount: readInt("SHARD_COUNT"),
    maxJobRetries: readInt("MAX_JOB_RETRIES"),
    queueProvider: readString("QUEUE_PROVIDER"),
    redisUrl: readString("REDIS_URL"),
    redisKeyPrefix: readString("REDIS_KEY_PREFIX"),
    tokenStoreProvider: readString("TOKEN_STORE_PROVIDER"),
    tokenStoreFile: readString("TOKEN_STORE_FILE"),
    tokenStoreEncryptionKey: readString("TOKEN_STORE_ENCRYPTION_KEY"),
    adminApiToken: readString("ADMIN_API_TOKEN"),
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      redirectUri: readString("SPOTIFY_REDIRECT_URI"),
      scopes: readString("SPOTIFY_SCOPES"),
      mockMode: readBoolean("SPOTIFY_MOCK_MODE"),
      maxRetries: readInt("SPOTIFY_MAX_RETRIES"),
      retryBaseMs: readInt("SPOTIFY_RETRY_BASE_MS")
    },
    lavalink: {
      nodes: readLavalinkNodes(),
      defaultSource: readString("LAVALINK_DEFAULT_SOURCE")
    }
  };
}
