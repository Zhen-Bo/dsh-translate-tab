import {afterEach, describe, expect, it, vi} from 'vitest';

import {streamTranslation} from '../src/client/translate-api';

const encoder = new TextEncoder();

function respondWith(chunks: Uint8Array[], status = 200) {
  const body = new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk));
      controller.close();
    },
  });
  vi.stubGlobal('fetch', async () => new Response(body, {status}));
}

async function translate() {
  let text = '';
  await streamTranslation(
    {provider: 'p', model: 'm', effort: '', text: 'hi'},
    {
      signal: new AbortController().signal,
      onText: delta => {
        text += delta;
      },
    },
  );
  return text;
}

describe('streamTranslation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('joins text split across chunks, even inside a character', async () => {
    const bytes = encoder.encode('{"t":"text","v":"譯"}\n{"t":"done"}\n');
    respondWith([bytes.slice(0, 18), bytes.slice(18)]);
    expect(await translate()).toBe('譯');
  });

  it('rejects a stream that ends without a final event', async () => {
    respondWith([encoder.encode('{"t":"text","v":"a"}\n')]);
    await expect(translate()).rejects.toMatchObject({code: 'cutoff'});
  });

  it('rejects with the model error', async () => {
    respondWith([encoder.encode('{"t":"error","message":"boom"}\n')]);
    await expect(translate()).rejects.toMatchObject({
      code: 'model',
      message: 'boom',
    });
  });

  it('uses the error from a failed response', async () => {
    respondWith([encoder.encode('{"error":"forbidden"}')], 403);
    await expect(translate()).rejects.toMatchObject({
      code: 'http',
      message: 'forbidden',
    });
  });
});
