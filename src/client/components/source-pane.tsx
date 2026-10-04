import {
  IconCloseOutlineRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import clsx from 'clsx';
import {useEffect, useMemo, useRef} from 'react';

import {MAX_SOURCE_CHARS} from '../../shared/stream-protocol';
import type {Translate} from '../i18n';
import {countCharacters, isSubmitKey, SEND_KEYS} from '../text-input';

interface SourcePaneProps {
  source: string;
  tooLong: boolean;
  swapCount: number;
  onChange: (source: string) => void;
  onSubmitShortcut: () => void;
  onClear: () => void;
  t: Translate;
}

export function SourcePane({
  source,
  tooLong,
  swapCount,
  onChange,
  onSubmitShortcut,
  onClear,
  t,
}: SourcePaneProps) {
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const end = field.current?.value.length ?? 0;
    field.current?.focus();
    field.current?.setSelectionRange(end, end);
  }, []);
  const characterCount = useMemo(() => countCharacters(source), [source]);
  const clearAndRefocus = () => {
    onClear();
    field.current?.focus();
  };

  const countLabel = `${characterCount.toLocaleString()} ${t('chars')}`;
  const limitLabel = t('tooLong', {max: MAX_SOURCE_CHARS.toLocaleString()});
  let meta = '';
  if (source) {
    meta = tooLong ? `${countLabel} · ${limitLabel}` : countLabel;
  }

  return (
    <section className="dtt-pane is-source" aria-label={t('source')}>
      <textarea
        key={`source-${swapCount}`}
        ref={field}
        className={clsx('dtt-text', swapCount > 0 && 'dtt-swapped')}
        value={source}
        dir="auto"
        placeholder={t('placeholder', {shortcut: SEND_KEYS.join(' ')})}
        aria-label={t('source')}
        spellCheck={false}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (isSubmitKey(event)) {
            event.preventDefault();
            onSubmitShortcut();
          }
        }}
      />
      <Tooltip label={t('clear')} side="left" delayMs={400} disabled={!source}>
        <button
          type="button"
          className={clsx('dtt-clear', !source && 'is-hidden')}
          aria-label={t('clear')}
          tabIndex={source ? 0 : -1}
          onClick={clearAndRefocus}
        >
          <IconCloseOutlineRegular size={14} />
        </button>
      </Tooltip>
      <div className="dtt-foot">
        <span className={clsx('dtt-meta', tooLong && 'is-over')}>{meta}</span>
      </div>
    </section>
  );
}
