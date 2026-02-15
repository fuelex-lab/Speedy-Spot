import http from "node:http";
import { JOB_TYPES } from "../core/events.js";

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

function getPath(reqUrl) {
  return new URL(reqUrl, "http://localhost");
}

function validateJob(body) {
  if (!body.type || !body.payload) {
    return "type and payload are required";
  }

  if (body.type === JOB_TYPES.PLAYBACK_ENQUEUE) {
    if (!body.payload.guildId) {
      return "playback.enqueue requires payload.guildId";
    }

    if (!body.payload.trackId && !body.payload.query) {
      return "playback.enqueue requires payload.trackId or payload.query";
    }
  } else if (body.type === JOB_TYPES.SPOTIFY_PLAYLIST_SYNC) {
    if (!body.payload.userId || !body.payload.playlistId) {
      return "spotify.playlist.sync requires payload.userId and payload.playlistId";
    }
  } else if (body.type === JOB_TYPES.LAVALINK_VOICE_UPDATE) {
    if (!body.payload.guildId || !body.payload.sessionId || !body.payload.token || !body.payload.endpoint) {
      return "lavalink.voice.update requires payload.guildId, payload.sessionId, payload.token, and payload.endpoint";
    }
  } else {
    return `unsupported job type: ${body.type}`;
  }

  return null;
}

function isProtectedRoute(method, url) {
  if (method === "GET" && url.startsWith("/health")) {
    return false;
  }

  if (method === "POST" && url.startsWith("/auth/spotify/callback")) {
    return false;
  }

  return true;
}

function isAuthorized(method, url, headers, token) {
  if (!token) {
    return true;
  }

  if (!isProtectedRoute(method, url)) {
    return true;
  }

  const provided = headers["x-api-token"];
  return typeof provided === "string" && provided === token;
}

export async function handleApiRequest(request, deps) {
  const { method, url, headers = {}, body = {} } = request;
  const { config, queue, metrics, clusterManager, spotifyService } = deps;

  if (!isAuthorized(method, url, headers, config.adminApiToken)) {
    return { statusCode: 401, payload: { error: "Unauthorized" } };
  }

  const requestUrl = getPath(url);

  if (method === "GET" && requestUrl.pathname === "/health") {
    return {
      statusCode: 200,
      payload: {
        status: "ok",
        clusters: clusterManager.snapshot().length,
        queueDepth: await queue.size()
      }
    };
  }

  if (method === "GET" && requestUrl.pathname === "/metrics") {
    return {
      statusCode: 200,
      payload: {
        ...metrics.snapshot(),
        queueDepth: await queue.size(),
        deadLetterDepth: await queue.deadLetterSize(),
        clusters: clusterManager.snapshot()
      }
    };
  }

  if (method === "GET" && requestUrl.pathname === "/clusters") {
    return { statusCode: 200, payload: { clusters: clusterManager.snapshot() } };
  }

  if (method === "GET" && requestUrl.pathname === "/auth/spotify/url") {
    const userId = requestUrl.searchParams.get("userId");
    if (!userId) {
      return { statusCode: 400, payload: { error: "userId query param is required" } };
    }

    const authUrl = spotifyService.createAuthorizeUrl({
      userId,
      state: requestUrl.searchParams.get("state") ?? undefined,
      scope: requestUrl.searchParams.get("scope") ?? undefined
    });

    return { statusCode: 200, payload: authUrl };
  }

  if (method === "POST" && requestUrl.pathname === "/jobs") {
    const validationError = validateJob(body);
    if (validationError) {
      return { statusCode: 400, payload: { error: validationError } };
    }

    const job = await queue.enqueue({
      id: crypto.randomUUID(),
      type: body.type,
      payload: body.payload,
      priority: body.priority ?? "normal"
    });

    return { statusCode: 202, payload: { enqueued: job.id, type: job.type } };
  }

  if (method === "POST" && requestUrl.pathname === "/auth/spotify/callback") {
    const token = await spotifyService.exchangeCode({
      userId: body.userId,
      code: body.code
    });
    return { statusCode: 200, payload: { ok: true, expiresAt: token.expiresAt } };
  }

  if (method === "POST" && requestUrl.pathname === "/demo/seed") {
    await queue.enqueue({
      id: crypto.randomUUID(),
      type: JOB_TYPES.PLAYBACK_ENQUEUE,
      payload: {
        guildId: "guild-1",
        trackId: "track-1"
      },
      priority: "high"
    });

    return { statusCode: 202, payload: { seeded: true } };
  }

  return { statusCode: 404, payload: { error: "Not Found" } };
}

export function createHttpServer(deps) {
  const { config } = deps;

  const server = http.createServer(async (req, res) => {
    try {
      const body = await readBody(req);
      const result = await handleApiRequest(
        {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body
        },
        deps
      );
      return sendJson(res, result.statusCode, result.payload);
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  });

  return {
    start() {
      server.listen(config.port);
    },
    stop() {
      server.close();
    }
  };
}
