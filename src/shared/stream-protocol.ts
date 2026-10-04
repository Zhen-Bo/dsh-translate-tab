export const STREAM_PATH = '/translate/api/stream';

export const MAX_SOURCE_CHARS = 100_000;
export const PROMPT_TEMPLATE_HEADROOM_CHARS = 20_000;
export const MAX_PROMPT_CHARS =
  MAX_SOURCE_CHARS + PROMPT_TEMPLATE_HEADROOM_CHARS;

export interface StreamRequest {
  provider: string;
  model: string;
  text: string;
  system?: string;
  reasoningEffort?: string;
}

export type StreamEvent =
  | {t: 'text'; v: string}
  | {t: 'done'}
  | {t: 'aborted'}
  | {t: 'error'; message: string};
