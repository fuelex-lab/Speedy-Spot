import test from "node:test";
import assert from "node:assert/strict";
import { assignLavalinkNodesToClusters, LavalinkRouter } from "../src/lavalink/router.js";

test("assignLavalinkNodesToClusters distributes nodes across clusters", () => {
  const clusters = [
    { id: "cluster-1", shards: [0, 2] },
    { id: "cluster-2", shards: [1, 3] },
    { id: "cluster-3", shards: [4, 5] }
  ];

  const nodes = [{ id: "node-a" }, { id: "node-b" }];
  const mapped = assignLavalinkNodesToClusters(clusters, nodes);

  assert.deepEqual(mapped[0].lavalinkNodeIds, ["node-a"]);
  assert.deepEqual(mapped[1].lavalinkNodeIds, ["node-b"]);
  assert.deepEqual(mapped[2].lavalinkNodeIds, ["node-a"]);
});

test("LavalinkRouter resolves preferred node deterministically", () => {
  const router = new LavalinkRouter({
    clusterId: "cluster-1",
    shardIds: [0, 2, 4],
    lavalinkNodeIds: ["node-a", "node-b"]
  });

  const byShard = router.resolvePreferredNodeId({ guildId: "123", shardId: 3 });
  assert.equal(byShard, "node-b");

  const byGuildFirst = router.resolvePreferredNodeId({ guildId: "guild-abc" });
  const byGuildSecond = router.resolvePreferredNodeId({ guildId: "guild-abc" });
  assert.equal(byGuildFirst, byGuildSecond);
});
