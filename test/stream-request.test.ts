import type {IncomingMessage} from 'node:http';
import {Readable} from 'node:stream';
import {describe, expect, it} from 'vitest';

import {readStreamRequest} from '../src/server/stream-request';
import {isSameOriginTrustedRequest} from '../src/server/trust';
import {MAX_PROMPT_CHARS} from '../src/shared/stream-protocol';

function requestWith(body: string, headers: Record<string, string> = {}) {
  return Object.assign(Readable.from([Buffer.from(body)]), {
    headers,
  }) as unknown as IncomingMessage;
}

describe('readStreamRequest', () => {
  it('reads the fields the browser sends', async () => {
    const body = JSON.stringify({provider: 'p', model: 'm', text: 't'});
    await expect(readStreamRequest(requestWith(body))).resolves.toEqual({
      provider: 'p',
      model: 'm',
      text: 't',
      system: undefined,
      reasoningEffort: undefined,
    });
  });

  it('rejects missing fields and oversized text', async () => {
    await expect(
      readStreamRequest(requestWith(JSON.stringify({provider: 'p'}))),
    ).rejects.toThrow('"model" must be a non-empty string');
    const tooLong = 'x'.repeat(MAX_PROMPT_CHARS + 1);
    const body = JSON.stringify({provider: 'p', model: 'm', text: tooLong});
    await expect(readStreamRequest(requestWith(body))).rejects.toThrow(
      `text exceeds ${MAX_PROMPT_CHARS} characters`,
    );
  });
});

describe('isSameOriginTrustedRequest', () => {
  const check = (headers: Record<string, string>, trusted?: string[]) =>
    isSameOriginTrustedRequest(requestWith('', headers), trusted);

  it('allows same-origin loopback and trusted hosts', () => {
    expect(check({host: '127.0.0.1:4066'})).toBe(true);
    expect(
      check({host: 'localhost:4066', origin: 'http://localhost:4066'}),
    ).toBe(true);
    expect(check({host: 'box.lan:80'}, ['box.lan'])).toBe(true);
  });

  it('blocks other hosts and cross-site requests', () => {
    expect(check({host: 'evil.com'})).toBe(false);
    expect(check({host: '127.0.0.1', origin: 'http://evil.com'})).toBe(false);
    expect(check({host: '127.0.0.1', 'sec-fetch-site': 'cross-site'})).toBe(
      false,
    );
  });
});
