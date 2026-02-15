function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function assignLavalinkNodesToClusters(clusterDefs, nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return clusterDefs.map((cluster) => ({ ...cluster, lavalinkNodeIds: [] }));
  }

  return clusterDefs.map((cluster, index) => ({
    ...cluster,
    lavalinkNodeIds: [nodes[index % nodes.length].id]
  }));
}

export class LavalinkRouter {
  constructor({ clusterId, shardIds = [], lavalinkNodeIds = [] }) {
    this.clusterId = clusterId;
    this.shardIds = shardIds;
    this.lavalinkNodeIds = lavalinkNodeIds;
  }

  isEnabled() {
    return this.lavalinkNodeIds.length > 0;
  }

  resolvePreferredNodeId({ guildId, shardId }) {
    if (!this.isEnabled()) {
      return null;
    }

    if (typeof shardId === "number") {
      return this.lavalinkNodeIds[shardId % this.lavalinkNodeIds.length];
    }

    if (guildId) {
      const hash = hashString(guildId);
      return this.lavalinkNodeIds[hash % this.lavalinkNodeIds.length];
    }

    return this.lavalinkNodeIds[0];
  }

  snapshot() {
    return {
      clusterId: this.clusterId,
      shardIds: this.shardIds,
      lavalinkNodeIds: this.lavalinkNodeIds
    };
  }
}
