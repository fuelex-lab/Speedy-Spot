import { WorkerPool } from "../workers/workerPool.js";
import { assignLavalinkNodesToClusters, LavalinkRouter } from "../lavalink/router.js";

export function assignShards(clusterCount, shardCount) {
  const clusters = Array.from({ length: clusterCount }, (_, i) => ({
    id: `cluster-${i + 1}`,
    shards: []
  }));

  for (let shard = 0; shard < shardCount; shard += 1) {
    const clusterIndex = shard % clusterCount;
    clusters[clusterIndex].shards.push(shard);
  }

  return clusters;
}

export class ClusterManager {
  constructor({
    clusterCount,
    workersPerCluster,
    shardCount,
    queue,
    playbackCoordinator,
    spotifyService,
    lavalinkClient,
    metrics,
    logger
  }) {
    this.clusterCount = clusterCount;
    this.workersPerCluster = workersPerCluster;
    this.shardCount = shardCount;
    this.queue = queue;
    this.playbackCoordinator = playbackCoordinator;
    this.spotifyService = spotifyService;
    this.lavalinkClient = lavalinkClient;
    this.metrics = metrics;
    this.logger = logger;
    this.clusters = [];
  }

  start() {
    const shardMap = assignShards(this.clusterCount, this.shardCount);
    const clusterDefs = assignLavalinkNodesToClusters(shardMap, this.lavalinkClient?.listNodes?.() ?? []);

    this.clusters = clusterDefs.map((clusterDef) => {
      const lavalinkRouter = new LavalinkRouter({
        clusterId: clusterDef.id,
        shardIds: clusterDef.shards,
        lavalinkNodeIds: clusterDef.lavalinkNodeIds
      });

      const workerPool = new WorkerPool({
        count: this.workersPerCluster,
        clusterId: clusterDef.id,
        queue: this.queue,
        playbackCoordinator: this.playbackCoordinator,
        spotifyService: this.spotifyService,
        lavalinkClient: this.lavalinkClient,
        lavalinkRouter,
        metrics: this.metrics,
        logger: this.logger,
        idPrefix: clusterDef.id
      });

      workerPool.start();
      this.logger.info("cluster started", {
        clusterId: clusterDef.id,
        shards: clusterDef.shards,
        workers: workerPool.size(),
        lavalinkNodeIds: clusterDef.lavalinkNodeIds
      });

      return {
        id: clusterDef.id,
        shards: clusterDef.shards,
        lavalinkNodeIds: clusterDef.lavalinkNodeIds,
        workerPool,
        lavalinkRouter,
        status: "healthy",
        lastHeartbeat: Date.now()
      };
    });
  }

  stop() {
    for (const cluster of this.clusters) {
      cluster.workerPool.stop();
      cluster.status = "stopped";
    }
  }

  heartbeat() {
    const now = Date.now();
    for (const cluster of this.clusters) {
      cluster.lastHeartbeat = now;
      if (cluster.status !== "stopped") {
        cluster.status = "healthy";
      }
    }
  }

  snapshot() {
    return this.clusters.map((cluster) => ({
      id: cluster.id,
      shards: cluster.shards,
      lavalinkNodeIds: cluster.lavalinkNodeIds,
      status: cluster.status,
      workers: cluster.workerPool.size(),
      lastHeartbeat: cluster.lastHeartbeat
    }));
  }
}
