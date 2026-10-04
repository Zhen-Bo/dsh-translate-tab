import {AUTO} from './languages';

export interface LanguagePair {
  from: string;
  to: string;
  lastFrom: string;
}

export function pickSource(from: string): Partial<LanguagePair> {
  return from === AUTO ? {from} : {from, lastFrom: from};
}

export function pickTarget(
  pair: LanguagePair,
  to: string,
): Partial<LanguagePair> {
  const pickedTheSourceLanguage = to === pair.from;
  return pickedTheSourceLanguage ? {to, from: pair.to} : {to};
}

function swapTargetForAutoSource(
  {to, lastFrom}: LanguagePair,
  detected: string | null,
  uiLanguage: string,
) {
  if (detected) {
    return detected;
  }
  if (lastFrom && lastFrom !== to) {
    return lastFrom;
  }
  return to === uiLanguage ? 'en' : uiLanguage;
}

export function swap(
  pair: LanguagePair,
  detected: string | null,
  uiLanguage: string,
): LanguagePair {
  const newTarget =
    pair.from === AUTO
      ? swapTargetForAutoSource(pair, detected, uiLanguage)
      : pair.from;
  return {from: pair.to, to: newTarget, lastFrom: pair.to};
}
