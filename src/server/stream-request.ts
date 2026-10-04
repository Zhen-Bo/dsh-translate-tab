import type {IncomingMessage} from 'node:http';

import {MAX_PROMPT_CHARS, type StreamRequest} from '../shared/stream-protocol';

const MAX_BODY_BYTES = 1 << 20;

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error('request body too large');
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requiredString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`"${key}" must be a non-empty string`);
}

function optionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (value === undefined || typeof value === 'string') {
    return value;
  }
  throw new Error(`"${key}" must be a string`);
}

export async function readStreamRequest(
  req: IncomingMessage,
): Promise<StreamRequest> {
  const json = await readJson(req);
  const body = (
    typeof json === 'object' && json !== null ? json : {}
  ) as Record<string, unknown>;
  const request: StreamRequest = {
    provider: requiredString(body, 'provider'),
    model: requiredString(body, 'model'),
    text: requiredString(body, 'text'),
    system: optionalString(body, 'system'),
    reasoningEffort: optionalString(body, 'reasoningEffort'),
  };
  if (request.text.length > MAX_PROMPT_CHARS) {
    throw new Error(`text exceeds ${MAX_PROMPT_CHARS} characters`);
  }
  return request;
}
