import {
  IconCheckOutlineRegular,
  IconCopyOutlineRegular,
  IconWarningOutlineRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import clsx from 'clsx';
import {useMemo} from 'react';

import {copyText} from '../clipboard';
import {useTemporaryValue} from '../hooks/use-temporary-value';
import {useTypewriterReveal} from '../hooks/use-typewriter-reveal';
import type {MessageKey, Translate} from '../i18n';
import {findLanguage} from '../languages';
import {countCharacters} from '../text-input';

type CopyStatus = 'idle' | 'done' | 'fail';

const COPY_FEEDBACK_MS: Record<Exclude<CopyStatus, 'idle'>, number> = {
  done: 1500,
  fail: 2500,
};
const COPY_LABEL_KEYS: Record<CopyStatus, MessageKey> = {
  idle: 'copy',
  done: 'copied',
  fail: 'copyFailed',
};
const COPY_ICONS = {
  idle: IconCopyOutlineRegular,
  done: IconCheckOutlineRegular,
  fail: IconWarningOutlineRegular,
};

interface ResultPaneProps {
  result: string;
  busy: boolean;
  targetLanguage: string;
  swapCount: number;
  t: Translate;
}

export function ResultPane({
  result,
  busy,
  targetLanguage,
  swapCount,
  t,
}: ResultPaneProps) {
  const revealedResult = useTypewriterReveal(result);
  const revealing = revealedResult.length < result.length;
  const characterCount = useMemo(() => countCharacters(result), [result]);
  const [copyStatus, showCopyStatusFor] = useTemporaryValue<CopyStatus>('idle');
  const copyResult = async () => {
    const status = (await copyText(result)) ? 'done' : 'fail';
    showCopyStatusFor(status, COPY_FEEDBACK_MS[status]);
  };
  const copyLabel = t(COPY_LABEL_KEYS[copyStatus]);
  const CopyIcon = COPY_ICONS[copyStatus];
  const canCopy = Boolean(result) && !busy && !revealing;

  const emptyHint = (
    <span
      key={targetLanguage}
      className="dtt-placeholder"
      lang={targetLanguage}
    >
      {findLanguage(targetLanguage)?.emptyResultText ?? t('resultPlaceholder')}
    </span>
  );

  return (
    <section className="dtt-pane is-target" aria-label={t('target')}>
      <div
        key={`result-${swapCount}`}
        className={clsx(
          'dtt-text',
          'dtt-result',
          !result && !busy && 'is-empty',
          swapCount > 0 && 'dtt-swapped',
        )}
        dir="auto"
        role="region"
        aria-live="polite"
        aria-busy={busy}
        aria-label={t('target')}
      >
        {revealedResult || (!busy && emptyHint)}
        {(busy || revealing) && (
          <span className="dtt-cursor" aria-hidden="true" />
        )}
      </div>
      <div className="dtt-foot">
        <span className="dtt-meta">
          {result ? `${characterCount.toLocaleString()} ${t('chars')}` : ''}
        </span>
        <span className="dtt-sr" aria-live="polite">
          {copyStatus === 'idle' ? '' : copyLabel}
        </span>
        {canCopy && (
          <Tooltip label={copyLabel} side="top" delayMs={300}>
            <button
              type="button"
              className={clsx(
                'dtt-icon-btn',
                copyStatus === 'done' && 'is-done',
                copyStatus === 'fail' && 'is-fail',
              )}
              aria-label={t('copy')}
              onClick={() => void copyResult()}
            >
              <CopyIcon size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </section>
  );
}
