import {
  IconWarningOutlineRegular,
  Toast,
} from '@deepseek-ai/dsh-client-ui-primitives';

import {explainFailure} from '../failure';
import type {Translate} from '../i18n';

const FAILURE_TOAST_MS = 5000;

interface FailureToastProps {
  error: unknown;
  anchor: Element | null;
  onDone: () => void;
  t: Translate;
}

export function FailureToast({error, anchor, onDone, t}: FailureToastProps) {
  const {title, hint} = explainFailure(error, t);
  return (
    <Toast
      anchor={anchor}
      holdMs={FAILURE_TOAST_MS}
      icon={
        <span className="dtt-toast-icon">
          <IconWarningOutlineRegular size={16} />
        </span>
      }
      text={
        <>
          <span className="dtt-toast-title">{title}</span>
          {hint}
        </>
      }
      onDone={onDone}
    />
  );
}
