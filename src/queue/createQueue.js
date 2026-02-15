import { InMemoryQueue } from "./inMemoryQueue.js";
import { RedisQueue } from "./redisQueue.js";

export async function createQueue({ config, metrics }) {
  if (config.queueProvider === "memory") {
    return new InMemoryQueue({ metrics, maxRetries: config.maxJobRetries });
  }

  if (config.queueProvider === "redis") {
    const queue = new RedisQueue({
      metrics,
      maxRetries: config.maxJobRetries,
      redisUrl: config.redisUrl,
      keyPrefix: config.redisKeyPrefix
    });
    await queue.connect();
    return queue;
  }

  throw new Error(`Unsupported QUEUE_PROVIDER: ${config.queueProvider}`);
}
