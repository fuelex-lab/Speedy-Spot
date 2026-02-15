import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryMetrics } from "../src/telemetry/metrics.js";
import { InMemoryQueue } from "../src/queue/inMemoryQueue.js";
import { METRIC_KEYS } from "../src/core/events.js";

test("queue prioritizes high priority jobs", () => {
  const metrics = new InMemoryMetrics();
  const queue = new InMemoryQueue({ metrics, maxRetries: 2 });

  queue.enqueue({ id: "1", type: "a", payload: {}, priority: "low" });
  queue.enqueue({ id: "2", type: "a", payload: {}, priority: "high" });

  const first = queue.dequeue();
  assert.equal(first.id, "2");
});

test("queue moves jobs to dead-letter after max retries", () => {
  const metrics = new InMemoryMetrics();
  const queue = new InMemoryQueue({ metrics, maxRetries: 1 });

  queue.enqueue({ id: "1", type: "a", payload: {}, priority: "normal" });

  const firstAttempt = queue.dequeue();
  const retryAttempt = queue.requeue(firstAttempt);
  assert.equal(retryAttempt.attempts, 1);

  const secondAttempt = queue.dequeue();
  const dropped = queue.requeue(secondAttempt);

  assert.equal(dropped, null);
  assert.equal(queue.deadLetterSize(), 1);
  const snapshot = metrics.snapshot();
  assert.equal(snapshot.counters[METRIC_KEYS.JOB_DLQ], 1);
});
