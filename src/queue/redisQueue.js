import { METRIC_KEYS } from "../core/events.js";

const PRIORITY_SCORE = {
  high: 3,
  normal: 2,
  low: 1
};

async function loadRedisClient() {
  const redisModule = await import("redis");
  return redisModule.createClient;
}

export class RedisQueue {
  constructor({ metrics, maxRetries = 3, redisUrl, keyPrefix = "speedyspot" }) {
    this.metrics = metrics;
    this.maxRetries = maxRetries;
    this.redisUrl = redisUrl;
    this.keyPrefix = keyPrefix;
    this.client = null;
    this.keys = {
      queue: `${keyPrefix}:queue`,
      deadLetter: `${keyPrefix}:dlq`
    };
  }

  async connect() {
    if (this.client) {
      return;
    }

    const createClient = await loadRedisClient();
    this.client = createClient({ url: this.redisUrl });
    this.client.on("error", () => {
      // Runtime logs already capture failures at call sites.
    });
    await this.client.connect();
  }

  async close() {
    if (!this.client) {
      return;
    }
    await this.client.quit();
    this.client = null;
  }

  async enqueue(job) {
    await this.connect();
    const queued = {
      ...job,
      attempts: job.attempts ?? 0,
      insertedAt: Date.now()
    };
    const score = this.#score(queued);
    await this.client.zAdd(this.keys.queue, {
      score,
      value: JSON.stringify(queued)
    });
    this.metrics.increment(METRIC_KEYS.JOB_RECEIVED);
    return queued;
  }

  async dequeue() {
    await this.connect();
    const rows = await this.client.zPopMax(this.keys.queue);
    if (!rows || rows.length === 0) {
      return null;
    }
    return JSON.parse(rows[0].value);
  }

  async requeue(job) {
    await this.connect();
    const updated = {
      ...job,
      attempts: (job.attempts ?? 0) + 1,
      insertedAt: Date.now()
    };

    if (updated.attempts > this.maxRetries) {
      await this.client.rPush(this.keys.deadLetter, JSON.stringify(updated));
      this.metrics.increment(METRIC_KEYS.JOB_DLQ);
      return null;
    }

    this.metrics.increment(METRIC_KEYS.JOB_RETRIED);
    await this.client.zAdd(this.keys.queue, {
      score: this.#score(updated),
      value: JSON.stringify(updated)
    });
    return updated;
  }

  async size() {
    await this.connect();
    return this.client.zCard(this.keys.queue);
  }

  async deadLetterSize() {
    await this.connect();
    return this.client.lLen(this.keys.deadLetter);
  }

  #score(job) {
    const priorityWeight = PRIORITY_SCORE[job.priority] ?? PRIORITY_SCORE.normal;
    const epochPart = Date.now();
    return priorityWeight * 10 ** 13 + epochPart;
  }
}
