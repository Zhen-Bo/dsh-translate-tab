import type {IncomingMessage, ServerResponse} from 'node:http';

import {PLUGIN_ID} from '../shared/plugin-id';
import {STREAM_PATH, type StreamEvent} from '../shared/stream-protocol';
import type {LlmFinishReason, ServerContext} from './host-context';
import {readStreamRequest} from './stream-request';
import {isSameOriginTrustedRequest} from './trust';

export const name = PLUGIN_ID;
export const inject = ['webServer', 'llm', 'webRuntime'];

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function failureMessage(reason: LlmFinishReason) {
  const failure = reason.failure;
  if (!failure) {
    return 'model call failed';
  }
  return [failure.code, failure.message].filter(Boolean).join(': ');
}

function sendJson(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify(body));
}

export function apply(ctx: ServerContext) {
  const handleStream = async (req: IncomingMessage, res: ServerResponse) => {
    if (!isSameOriginTrustedRequest(req, ctx.webRuntime?.trustedHosts)) {
      return sendJson(res, 403, {error: 'forbidden'});
    }
    if (req.method !== 'POST') {
      return sendJson(res, 405, {error: 'method not allowed'});
    }

    let request;
    try {
      request = await readStreamRequest(req);
    } catch (error) {
      return sendJson(res, 400, {error: messageOf(error)});
    }

    const controller = new AbortController();
    res.on('close', () => controller.abort());
    res.writeHead(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    });
    const send = (event: StreamEvent) => {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`${JSON.stringify(event)}\n`);
      }
    };

    try {
      const chunks = ctx.llm.stream({
        provider: request.provider,
        model: request.model,
        messages: [
          {role: 'user', content: [{type: 'text', text: request.text}]},
        ],
        ...(request.system ? {system: request.system} : {}),
        ...(request.reasoningEffort
          ? {reasoningEffort: request.reasoningEffort}
          : {}),
        signal: controller.signal,
      });
      for await (const chunk of chunks) {
        if (chunk.type === 'text-delta') {
          send({t: 'text', v: chunk.text});
        } else if (chunk.type === 'finish') {
          const kind = chunk.reason?.kind;
          if (kind === 'error') {
            send({t: 'error', message: failureMessage(chunk.reason)});
          } else if (kind === 'aborted') {
            send({t: 'aborted'});
          } else {
            send({t: 'done'});
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        send({t: 'error', message: messageOf(error)});
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: STREAM_PATH,
        handler: handleStream,
      }),
    `${PLUGIN_ID}: ${STREAM_PATH}`,
  );
}
