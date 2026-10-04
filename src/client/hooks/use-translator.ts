import {useCallback, useEffect, useRef, useState} from 'react';

import {streamTranslation, type TranslationRequest} from '../translate-api';
import {useTemporaryValue} from './use-temporary-value';

const DONE_FEEDBACK_MS = 900;

export interface TranslationFailure {
  error: unknown;
  /** Tells repeated failures apart so each one shows its own toast. */
  id: number;
}

export function useTranslator(initialResult: string) {
  const [result, setResult] = useState(initialResult);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<TranslationFailure | null>(null);
  const [justFinished, showJustFinishedFor] = useTemporaryValue(false);
  const running = useRef<AbortController | null>(null);
  useEffect(() => () => running.current?.abort(), []);

  const stop = useCallback(() => running.current?.abort(), []);

  const start = useCallback(
    async (request: TranslationRequest) => {
      const controller = new AbortController();
      running.current = controller;
      setBusy(true);
      setFailure(null);
      setResult('');
      try {
        await streamTranslation(request, {
          signal: controller.signal,
          onText: delta => setResult(current => current + delta),
        });
        if (!controller.signal.aborted) {
          showJustFinishedFor(true, DONE_FEEDBACK_MS);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFailure({error, id: Date.now()});
        }
      } finally {
        if (running.current === controller) {
          running.current = null;
        }
        setBusy(false);
      }
    },
    [showJustFinishedFor],
  );

  const clearFailure = useCallback(() => setFailure(null), []);
  const dismissFailure = useCallback(
    (id: number) =>
      setFailure(current => (current?.id === id ? null : current)),
    [],
  );

  return {
    result,
    setResult,
    busy,
    justFinished,
    failure,
    start,
    stop,
    clearFailure,
    dismissFailure,
  };
}
