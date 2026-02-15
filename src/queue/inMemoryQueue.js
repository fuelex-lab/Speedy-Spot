import { METRIC_KEYS } from "../core/events.js";

const PRIORITY_WEIGHT = {
  high: 3,
  normal: 2,
  low: 1
};

function sortByPriority(a, b) {
  const scoreA = PRIORITY_WEIGHT[a.priority] ?? PRIORITY_WEIGHT.normal;
  const scoreB = PRIORITY_WEIGHT[b.priority] ?? PRIORITY_WEIGHT.normal;
  if (scoreA === scoreB) {
    return a.insertedAt - b.insertedAt;
  }
  return scoreB - scoreA;
}

export class InMemoryQueue {
  constructor({ metrics, maxRetries = 3 }) {
    this.metrics = metrics;
    this.maxRetries = maxRetries;
    this.items = [];
    this.deadLetterQueue = [];
  }

  enqueue(job) {
    const queued = {
      ...job,
      attempts: job.attempts ?? 0,
      insertedAt: Date.now()
    };
    this.items.push(queued);
    this.items.sort(sortByPriority);
    this.metrics.increment(METRIC_KEYS.JOB_RECEIVED);
    return queued;
  }

  dequeue() {
    return this.items.shift() ?? null;
  }

  requeue(job) {
    const updated = {
      ...job,
      attempts: job.attempts + 1,
      insertedAt: Date.now()
    };

    if (updated.attempts > this.maxRetries) {
      this.deadLetterQueue.push(updated);
      this.metrics.increment(METRIC_KEYS.JOB_DLQ);
      return null;
    }

    this.metrics.increment(METRIC_KEYS.JOB_RETRIED);
    this.items.push(updated);
    this.items.sort(sortByPriority);
    return updated;
  }

  size() {
    return this.items.length;
  }

  deadLetterSize() {
    return this.deadLetterQueue.length;
  }
}
