/**
 * Host half of dsh-translate-tab.
 *
 * One route, POST /translate/api/stream, streams a single model call as
 * newline-delimited JSON. The browser picks provider, model and reasoning
 * effort, and sends the finished prompt as the text, so the plugin keeps no
 * model settings of its own.
 *
 * Wire format, one JSON object per line:
 *   {"t":"text","v":"..."}      translated text delta
 *   {"t":"done"}                finished normally
 *   {"t":"aborted"}             the model call was cancelled
 *   {"t":"error","message":""}  failed
 */

export const name = 'dsh-translate-tab'
export const inject = ['webServer', 'llm', 'webRuntime']

const MAX_BODY_BYTES = 1 << 20
// The browser caps the source text at 100k characters; the rest is room for the prompt template.
const MAX_TEXT_CHARS = 120_000

function isLoopback(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return parts.length === 4 && parts[0] === '127' && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)
}

/** Same browser-trust fence as the built-in /api routes: loopback or trusted host, same-origin only. */
function isTrusted(req, trustedHosts) {
  const host = req.headers.host
  if (typeof host !== 'string') return false
  let hostUrl
  try {
    hostUrl = new URL(`http://${host}`)
  } catch {
    return false
  }
  const known = isLoopback(hostUrl.hostname) || (trustedHosts ?? []).some((entry) => {
    try {
      const entryUrl = new URL(`http://${entry}`)
      return entry.includes(':') ? entryUrl.host === hostUrl.host : entryUrl.hostname === hostUrl.hostname
    } catch {
      return false
    }
  })
  if (!known) return false
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (typeof origin !== 'string') return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

async function readJson(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error('request body too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function readStringField(value, key, { optional = false } = {}) {
  const v = value?.[key]
  if (typeof v === 'string' && (v.length > 0 || optional)) return v
  if (optional && v === undefined) return undefined
  throw new Error(`"${key}" must be a non-empty string`)
}

function failureMessage(finish) {
  const failure = finish?.failure
  if (!failure) return 'model call failed'
  return [failure.code, failure.message].filter(Boolean).join(': ')
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/translate/api/stream',
    handler: async (req, res) => {
      const json = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(body))
      }
      if (!isTrusted(req, ctx.webRuntime?.trustedHosts)) return json(403, { error: 'forbidden' })
      if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

      let body
      try {
        body = await readJson(req)
        body = {
          provider: readStringField(body, 'provider'),
          model: readStringField(body, 'model'),
          system: readStringField(body, 'system', { optional: true }),
          text: readStringField(body, 'text'),
          reasoningEffort: readStringField(body, 'reasoningEffort', { optional: true }),
        }
        if (body.text.length > MAX_TEXT_CHARS) throw new Error(`text exceeds ${MAX_TEXT_CHARS} characters`)
      } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : String(error) })
      }

      const controller = new AbortController()
      res.on('close', () => controller.abort())
      res.writeHead(200, {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no',
      })
      const send = (line) => {
        if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(line)}\n`)
      }

      try {
        const options = {
          provider: body.provider,
          model: body.model,
          messages: [{ role: 'user', content: [{ type: 'text', text: body.text }] }],
          ...(body.system ? { system: body.system } : {}),
          ...(body.reasoningEffort ? { reasoningEffort: body.reasoningEffort } : {}),
          signal: controller.signal,
        }
        for await (const chunk of ctx.llm.stream(options)) {
          if (chunk.type === 'text-delta') {
            send({ t: 'text', v: chunk.text })
          } else if (chunk.type === 'finish') {
            const kind = chunk.reason?.kind
            if (kind === 'error') send({ t: 'error', message: failureMessage(chunk.reason) })
            else if (kind === 'aborted') send({ t: 'aborted' })
            else send({ t: 'done' })
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          send({ t: 'error', message: error instanceof Error ? error.message : String(error) })
        }
      } finally {
        if (!res.writableEnded) res.end()
      }
    },
  }), 'dsh-translate-tab: /translate/api/stream')
}
