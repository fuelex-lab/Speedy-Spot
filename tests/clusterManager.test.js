import test from "node:test";
import assert from "node:assert/strict";
import { assignShards } from "../src/cluster/clusterManager.js";

test("assignShards distributes shards across clusters", () => {
  const clusters = assignShards(3, 8);
  assert.equal(clusters.length, 3);
  assert.deepEqual(clusters[0].shards, [0, 3, 6]);
  assert.deepEqual(clusters[1].shards, [1, 4, 7]);
  assert.deepEqual(clusters[2].shards, [2, 5]);
});
