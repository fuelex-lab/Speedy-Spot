import { loadConfig } from "./core/config.js";
import { InMemoryMetrics } from "./telemetry/metrics.js";
import { logger } from "./telemetry/logger.js";
import { createQueue } from "./queue/createQueue.js";
import { PlaybackCoordinator } from "./playback/playbackCoordinator.js";
import { SpotifyService } from "./auth/spotifyService.js";
import { createTokenStore } from "./auth/createTokenStore.js";
import { LavalinkClient } from "./lavalink/client.js";
import { ClusterManager } from "./cluster/clusterManager.js";
import { createHttpServer } from "./api/httpServer.js";

const config = loadConfig();
const metrics = new InMemoryMetrics();
const queue = await createQueue({ config, metrics });
const tokenStore = createTokenStore(config);
const playbackCoordinator = new PlaybackCoordinator();
const spotifyService = new SpotifyService({
  config: config.spotify,
  tokenStore
});
const lavalinkClient = new LavalinkClient({
  nodes: config.lavalink.nodes,
  defaultSource: config.lavalink.defaultSource
});

const clusterManager = new ClusterManager({
  clusterCount: config.clusterCount,
  workersPerCluster: config.workersPerCluster,
  shardCount: config.shardCount,
  queue,
  playbackCoordinator,
  spotifyService,
  lavalinkClient,
  metrics,
  logger
});

clusterManager.start();
setInterval(() => clusterManager.heartbeat(), 5000);

metrics.setGauge("configured_clusters", config.clusterCount);
metrics.setGauge("configured_shards", config.shardCount);
metrics.setGauge("configured_workers_per_cluster", config.workersPerCluster);
metrics.setGauge("queue_provider_redis", config.queueProvider === "redis" ? 1 : 0);
metrics.setGauge("token_store_file", config.tokenStoreProvider === "file" ? 1 : 0);
metrics.setGauge("token_store_encrypted_file", config.tokenStoreProvider === "encrypted-file" ? 1 : 0);
metrics.setGauge("lavalink_enabled", lavalinkClient.isConfigured() ? 1 : 0);

const server = createHttpServer({
  config,
  queue,
  metrics,
  clusterManager,
  spotifyService
});
server.start();

logger.info("speedy-spot bootstrap complete", {
  env: config.nodeEnv,
  port: config.port,
  clusterCount: config.clusterCount,
  workersPerCluster: config.workersPerCluster,
  shardCount: config.shardCount,
  queueProvider: config.queueProvider,
  tokenStoreProvider: config.tokenStoreProvider,
  spotifyMockMode: config.spotify.mockMode,
  lavalinkNodes: config.lavalink.nodes.length
});

process.on("SIGINT", async () => {
  logger.info("shutdown signal received");
  clusterManager.stop();
  server.stop();
  if (typeof queue.close === "function") {
    await queue.close();
  }
  process.exit(0);
});
