import {MAX_SOURCE_CHARS} from '../shared/stream-protocol';
import type {MessageKey, Translate} from './i18n';

type FailureKind =
  'credential' | 'auth' | 'rate' | 'tooLong' | 'network' | 'cutoff' | 'generic';

const FAILURE_PATTERNS: ReadonlyArray<[FailureKind, RegExp]> = [
  ['credential', /MISSING_CREDENTIAL|no api key/i],
  ['auth', /\b(401|403)\b|unauthori[sz]ed|invalid.*key|forbidden/i],
  ['rate', /\b429\b|rate.?limit/i],
  ['tooLong', /exceeds \d+ characters/i],
  ['network', /failed to fetch|network|ECONN|socket/i],
];

const FAILURE_MESSAGES: Record<FailureKind, [MessageKey, MessageKey]> = {
  credential: ['errorCredentialTitle', 'errorCredentialHint'],
  auth: ['errorAuthTitle', 'errorAuthHint'],
  rate: ['errorRateTitle', 'errorRateHint'],
  tooLong: ['errorTooLongTitle', 'errorTooLongHint'],
  network: ['errorNetworkTitle', 'errorNetworkHint'],
  cutoff: ['errorCutoffTitle', 'errorCutoffHint'],
  generic: ['errorGenericTitle', 'errorGenericHint'],
};

function failureKindOf(error: unknown): FailureKind {
  if ((error as {code?: string} | null)?.code === 'cutoff') {
    return 'cutoff';
  }
  const message = error instanceof Error ? error.message : String(error ?? '');
  const match = FAILURE_PATTERNS.find(([, pattern]) => pattern.test(message));
  return match?.[0] ?? 'generic';
}

export function explainFailure(error: unknown, t: Translate) {
  const [titleKey, hintKey] = FAILURE_MESSAGES[failureKindOf(error)];
  const values = {max: MAX_SOURCE_CHARS.toLocaleString()};
  return {title: t(titleKey, values), hint: t(hintKey, values)};
}
