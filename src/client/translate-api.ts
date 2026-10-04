import {
  STREAM_PATH,
  type StreamEvent,
  type StreamRequest,
} from '../shared/stream-protocol';
import {LET_PROVIDER_DECIDE_EFFORT} from './model-selection';

export type TranslateErrorCode = 'http' | 'model' | 'cutoff';

export class TranslateError extends Error {
  readonly code: TranslateErrorCode;

  constructor(message: string, code: TranslateErrorCode) {
    super(message);
    this.code = code;
  }
}

export interface TranslationRequest {
  provider: string;
  model: string;
  effort: string;
  text: string;
}

async function errorMessageOf(response: Response) {
  const fallback = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as {error?: string};
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function* readLines(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) {
        break;
      }
      pending += decoder.decode(value, {stream: true});
      let lineEnd;
      while ((lineEnd = pending.indexOf('\n')) >= 0) {
        yield pending.slice(0, lineEnd);
        pending = pending.slice(lineEnd + 1);
      }
    }
    yield pending + decoder.decode();
  } finally {
    reader.cancel().catch(() => {});
  }
}

/** Resolves when the stream finishes or is aborted. */
export async function streamTranslation(
  {provider, model, effort, text}: TranslationRequest,
  {signal, onText}: {signal: AbortSignal; onText: (delta: string) => void},
) {
  const request: StreamRequest = {
    provider,
    model,
    text,
    ...(effort === LET_PROVIDER_DECIDE_EFFORT ? {} : {reasoningEffort: effort}),
  };
  const response = await fetch(STREAM_PATH, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new TranslateError(await errorMessageOf(response), 'http');
  }

  let receivedFinalEvent = false;
  for await (const line of readLines(response.body)) {
    if (!line.trim()) {
      continue;
    }
    const event = JSON.parse(line) as StreamEvent;
    if (event.t === 'text') {
      onText(event.v);
    } else if (event.t === 'done' || event.t === 'aborted') {
      receivedFinalEvent = true;
    } else if (event.t === 'error') {
      throw new TranslateError(event.message || 'model call failed', 'model');
    }
  }
  if (!receivedFinalEvent && !signal.aborted) {
    throw new TranslateError('stream ended early', 'cutoff');
  }
}
