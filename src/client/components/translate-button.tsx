import {
  IconCheckOutlineRegular,
  IconStopFillRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import clsx from 'clsx';

import {MAX_SOURCE_CHARS} from '../../shared/stream-protocol';
import type {Translate} from '../i18n';
import {SEND_KEYS} from '../text-input';
import {SendIcon} from './icons';

interface TranslateButtonProps {
  busy: boolean;
  justFinished: boolean;
  canTranslate: boolean;
  tooLong: boolean;
  onTranslate: () => void;
  onStop: () => void;
  t: Translate;
}

export function TranslateButton({
  busy,
  justFinished,
  canTranslate,
  tooLong,
  onTranslate,
  onStop,
  t,
}: TranslateButtonProps) {
  let tooltip = t('translate');
  if (busy) {
    tooltip = t('stop');
  } else if (tooLong) {
    tooltip = t('tooLong', {max: MAX_SOURCE_CHARS.toLocaleString()});
  }
  const showsShortcut = !busy && !tooLong;

  return (
    <Tooltip
      label={tooltip}
      shortcutKeys={showsShortcut ? SEND_KEYS : undefined}
      side="right"
      delayMs={300}
    >
      <button
        type="button"
        className={clsx(
          'dtt-send',
          busy ? 'is-busy' : justFinished && 'is-done',
        )}
        aria-label={busy ? t('stop') : t('translate')}
        disabled={!busy && !canTranslate}
        onClick={busy ? onStop : onTranslate}
      >
        <span className="dtt-send-icon i-arrow" aria-hidden="true">
          <SendIcon />
        </span>
        <span className="dtt-send-icon i-stop" aria-hidden="true">
          <IconStopFillRegular size={12} />
        </span>
        <span className="dtt-send-icon i-done" aria-hidden="true">
          <IconCheckOutlineRegular size={18} />
        </span>
      </button>
    </Tooltip>
  );
}
