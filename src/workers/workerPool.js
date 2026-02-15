import { Worker } from "./worker.js";

export class WorkerPool {
  constructor({
    count,
    clusterId,
    queue,
    playbackCoordinator,
    spotifyService,
    lavalinkClient,
    lavalinkRouter,
    metrics,
    logger,
    idPrefix
  }) {
    this.workers = Array.from({ length: count }, (_, index) => {
      return new Worker({
        id: `${idPrefix}-worker-${index + 1}`,
        clusterId,
        queue,
        playbackCoordinator,
        spotifyService,
        lavalinkClient,
        lavalinkRouter,
        metrics,
        logger
      });
    });
  }

  start() {
    for (const worker of this.workers) {
      worker.start();
    }
  }

  stop() {
    for (const worker of this.workers) {
      worker.stop();
    }
  }

  size() {
    return this.workers.length;
  }
}
