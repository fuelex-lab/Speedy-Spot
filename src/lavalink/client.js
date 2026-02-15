function normalizeNode(node, index) {
  if (!node?.url || !node?.password) {
    throw new Error(`Invalid Lavalink node at index ${index}`);
  }

  return {
    id: node.id ?? `node-${index + 1}`,
    url: node.url.replace(/\/$/, ""),
    password: node.password,
    sessionId: node.sessionId ?? null
  };
}

function withSearchPrefix(query, source) {
  if (query.includes(":")) {
    return query;
  }
  return `${source}:${query}`;
}

function normalizeTrack(track) {
  return {
    encoded: track.encoded,
    identifier: track.info?.identifier ?? null,
    title: track.info?.title ?? "unknown",
    author: track.info?.author ?? "unknown",
    uri: track.info?.uri ?? null,
    length: track.info?.length ?? 0,
    sourceName: track.info?.sourceName ?? "unknown"
  };
}

export class LavalinkClient {
  constructor({ nodes = [], fetchImpl = fetch, defaultSource = "spsearch" }) {
    this.nodes = nodes.map(normalizeNode);
    this.fetchImpl = fetchImpl;
    this.defaultSource = defaultSource;
    this.nextNodeIndex = 0;
    this.nodesById = new Map(this.nodes.map((node) => [node.id, node]));
  }

  isConfigured() {
    return this.nodes.length > 0;
  }

  listNodes() {
    return this.nodes;
  }

  async resolveTrack({ query, source, preferredNodeId }) {
    if (!this.isConfigured()) {
      throw new Error("Lavalink is not configured");
    }

    if (!query) {
      throw new Error("query is required for Lavalink resolution");
    }

    const identifier = withSearchPrefix(query, source ?? this.defaultSource);
    const nodesToTry = this.#buildNodeCandidates(preferredNodeId);

    for (const node of nodesToTry) {
      const endpoint = new URL(`${node.url}/v4/loadtracks`);
      endpoint.searchParams.set("identifier", identifier);

      try {
        const response = await this.fetchImpl(endpoint, {
          method: "GET",
          headers: {
            authorization: node.password,
            "user-agent": "speedy-spot/0.1"
          }
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const track = this.#pickTrack(data);
        if (!track) {
          continue;
        }

        return {
          nodeId: node.id,
          query: identifier,
          track: normalizeTrack(track)
        };
      } catch {
        // Try the next node.
      }
    }

    throw new Error("Unable to resolve track from any Lavalink node");
  }

  async playTrack({ guildId, encodedTrack, preferredNodeId, noReplace = true, pause, volume, position }) {
    if (!guildId || !encodedTrack) {
      throw new Error("guildId and encodedTrack are required for Lavalink player dispatch");
    }

    const payload = {
      track: {
        encoded: encodedTrack
      }
    };

    if (typeof pause === "boolean") {
      payload.paused = pause;
    }
    if (typeof volume === "number") {
      payload.volume = volume;
    }
    if (typeof position === "number") {
      payload.position = position;
    }

    return this.#patchPlayer({
      guildId,
      preferredNodeId,
      noReplace,
      payload
    });
  }

  async updateVoiceState({ guildId, sessionId, token, endpoint, preferredNodeId }) {
    if (!guildId || !sessionId || !token || !endpoint) {
      throw new Error("guildId, sessionId, token, and endpoint are required for Lavalink voice update");
    }

    return this.#patchPlayer({
      guildId,
      preferredNodeId,
      noReplace: false,
      payload: {
        voice: {
          sessionId,
          token,
          endpoint
        }
      }
    });
  }

  async #patchPlayer({ guildId, preferredNodeId, noReplace, payload }) {
    if (!this.isConfigured()) {
      throw new Error("Lavalink is not configured");
    }

    const nodesToTry = this.#buildNodeCandidates(preferredNodeId);
    for (const node of nodesToTry) {
      if (!node.sessionId) {
        continue;
      }

      const endpoint = new URL(`${node.url}/v4/sessions/${encodeURIComponent(node.sessionId)}/players/${encodeURIComponent(guildId)}`);
      endpoint.searchParams.set("noReplace", String(noReplace));

      try {
        const response = await this.fetchImpl(endpoint, {
          method: "PATCH",
          headers: {
            authorization: node.password,
            "content-type": "application/json",
            "user-agent": "speedy-spot/0.1"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          continue;
        }

        return {
          nodeId: node.id,
          guildId
        };
      } catch {
        // Try next node.
      }
    }

    throw new Error("Unable to dispatch player update to any Lavalink node");
  }

  #buildNodeCandidates(preferredNodeId) {
    const nodes = [];

    if (preferredNodeId && this.nodesById.has(preferredNodeId)) {
      nodes.push(this.nodesById.get(preferredNodeId));
    }

    const startIndex = this.nextNodeIndex;
    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[(startIndex + i) % this.nodes.length];
      if (!nodes.find((n) => n.id === node.id)) {
        nodes.push(node);
      }
    }

    this.nextNodeIndex = (this.nextNodeIndex + 1) % this.nodes.length;
    return nodes;
  }

  #pickTrack(payload) {
    const tracks = Array.isArray(payload?.data) ? payload.data : [];
    if (tracks.length === 0) {
      return null;
    }
    return tracks[0];
  }
}
