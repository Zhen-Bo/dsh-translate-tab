// src/shared/plugin-id.ts
var PLUGIN_ID = "dsh-translate-tab";

// src/shared/stream-protocol.ts
var STREAM_PATH = "/translate/api/stream";
var MAX_SOURCE_CHARS = 1e5;
var PROMPT_TEMPLATE_HEADROOM_CHARS = 2e4;
var MAX_PROMPT_CHARS = MAX_SOURCE_CHARS + PROMPT_TEMPLATE_HEADROOM_CHARS;

// src/server/stream-request.ts
var MAX_BODY_BYTES = 1 << 20;
async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error("request body too large");
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function requiredString(body, key) {
  const value = body[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  throw new Error(`"${key}" must be a non-empty string`);
}
function optionalString(body, key) {
  const value = body[key];
  if (value === void 0 || typeof value === "string") {
    return value;
  }
  throw new Error(`"${key}" must be a string`);
}
async function readStreamRequest(req) {
  const json = await readJson(req);
  const body = typeof json === "object" && json !== null ? json : {};
  const request = {
    provider: requiredString(body, "provider"),
    model: requiredString(body, "model"),
    text: requiredString(body, "text"),
    system: optionalString(body, "system"),
    reasoningEffort: optionalString(body, "reasoningEffort")
  };
  if (request.text.length > MAX_PROMPT_CHARS) {
    throw new Error(`text exceeds ${MAX_PROMPT_CHARS} characters`);
  }
  return request;
}

// src/server/trust.ts
function isLoopback(hostname) {
  if (hostname === "localhost" || hostname === "[::1]") {
    return true;
  }
  const parts = hostname.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function isTrustedHost(hostUrl, trustedHosts) {
  return trustedHosts.some((entry) => {
    try {
      const entryUrl = new URL(`http://${entry}`);
      const entryHasPort = entry.includes(":");
      return entryHasPort ? entryUrl.host === hostUrl.host : entryUrl.hostname === hostUrl.hostname;
    } catch {
      return false;
    }
  });
}
function isSameOriginTrustedRequest(req, trustedHosts = []) {
  const host = req.headers.host;
  if (typeof host !== "string") {
    return false;
  }
  let hostUrl;
  try {
    hostUrl = new URL(`http://${host}`);
  } catch {
    return false;
  }
  if (!isLoopback(hostUrl.hostname) && !isTrustedHost(hostUrl, trustedHosts)) {
    return false;
  }
  if (req.headers["sec-fetch-site"] === "cross-site") {
    return false;
  }
  const origin = req.headers.origin;
  if (typeof origin !== "string") {
    return true;
  }
  try {
    return new URL(origin).host === hostUrl.host;
  } catch {
    return false;
  }
}

// src/server/index.ts
var name = PLUGIN_ID;
var inject = ["webServer", "llm", "webRuntime"];
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function failureMessage(reason) {
  const failure = reason.failure;
  if (!failure) {
    return "model call failed";
  }
  return [failure.code, failure.message].filter(Boolean).join(": ");
}
function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function apply(ctx) {
  const handleStream = async (req, res) => {
    if (!isSameOriginTrustedRequest(req, ctx.webRuntime?.trustedHosts)) {
      return sendJson(res, 403, { error: "forbidden" });
    }
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "method not allowed" });
    }
    let request;
    try {
      request = await readStreamRequest(req);
    } catch (error) {
      return sendJson(res, 400, { error: messageOf(error) });
    }
    const controller = new AbortController();
    res.on("close", () => controller.abort());
    res.writeHead(200, {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no"
    });
    const send = (event) => {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`${JSON.stringify(event)}
`);
      }
    };
    try {
      const chunks = ctx.llm.stream({
        provider: request.provider,
        model: request.model,
        messages: [
          { role: "user", content: [{ type: "text", text: request.text }] }
        ],
        ...request.system ? { system: request.system } : {},
        ...request.reasoningEffort ? { reasoningEffort: request.reasoningEffort } : {},
        signal: controller.signal
      });
      for await (const chunk of chunks) {
        if (chunk.type === "text-delta") {
          send({ t: "text", v: chunk.text });
        } else if (chunk.type === "finish") {
          const kind = chunk.reason?.kind;
          if (kind === "error") {
            send({ t: "error", message: failureMessage(chunk.reason) });
          } else if (kind === "aborted") {
            send({ t: "aborted" });
          } else {
            send({ t: "done" });
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        send({ t: "error", message: messageOf(error) });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: STREAM_PATH,
      handler: handleStream
    }),
    `${PLUGIN_ID}: ${STREAM_PATH}`
  );
}
export {
  apply,
  inject,
  name
};
