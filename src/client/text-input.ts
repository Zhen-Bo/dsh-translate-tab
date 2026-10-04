import type {KeyboardEvent} from 'react';

const IS_MAC = /Mac|iPhone|iPad/.test(
  navigator.platform || navigator.userAgent || '',
);

export const SEND_KEYS: readonly string[] = IS_MAC
  ? ['⌘', 'Enter']
  : ['Ctrl', 'Enter'];

export function isSubmitKey(event: KeyboardEvent) {
  return (
    event.key === 'Enter' &&
    (event.ctrlKey || event.metaKey) &&
    !event.nativeEvent.isComposing
  );
}

const SEGMENTER_MAX_TEXT_LENGTH = 20_000;
const graphemeSegmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, {granularity: 'grapheme'})
    : null;

/** Long text counts code points instead, to keep typing fast. */
export function countCharacters(text: string) {
  if (!graphemeSegmenter || text.length > SEGMENTER_MAX_TEXT_LENGTH) {
    return [...text].length;
  }
  return Array.from(graphemeSegmenter.segment(text)).length;
}
