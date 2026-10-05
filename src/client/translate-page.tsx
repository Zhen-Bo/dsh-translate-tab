import {
  IconSlidersTwoOutlineRegular,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import clsx from 'clsx';
import {useEffect, useMemo, useRef, useState} from 'react';

import {MAX_SOURCE_CHARS} from '../shared/stream-protocol';
import {FailureToast} from './components/failure-toast';
import {SwapIcon} from './components/icons';
import {LanguagePicker} from './components/language-picker';
import {ModelPicker} from './components/model-picker';
import {PromptDialog} from './components/prompt-dialog';
import {ResultPane} from './components/result-pane';
import {SourcePane} from './components/source-pane';
import {TranslateButton} from './components/translate-button';
import type {ClientContext} from './host-context';
import {useActiveLocale} from './hooks/use-active-locale';
import {
  useHiddenModelIds,
  type BoundHiddenModelSource,
} from './hooks/use-hidden-model-ids';
import {useModelCatalog} from './hooks/use-model-catalog';
import {useSettings} from './hooks/use-settings';
import {useTranslator} from './hooks/use-translator';
import type {Translate} from './i18n';
import {pickSource, pickTarget, swap} from './language-choice';
import {
  AUTO,
  detectLanguage,
  nativeNameOf,
  translationLanguageForLocale,
} from './languages';
import {parseModelKey, resolveModelSelection} from './model-selection';
import {hideModels} from './model-visibility';
import {DEFAULT_PROMPT_TEMPLATE, fillPromptTemplate} from './prompt';
import {draftKeptAcrossRemounts, saveDraft, type Settings} from './settings';

interface TranslatePageProps {
  ctx: ClientContext;
  t: Translate;
  hiddenModelSources: readonly BoundHiddenModelSource[];
}

export function TranslatePage({
  ctx,
  t,
  hiddenModelSources,
}: TranslatePageProps) {
  const uiLanguage = translationLanguageForLocale(useActiveLocale(ctx.locale));
  const [settings, updateSettings] = useSettings();
  const [fullCatalog, reloadCatalog] = useModelCatalog(ctx);
  const hiddenModelIds = useHiddenModelIds(hiddenModelSources);
  const catalog = useMemo(
    () => ({
      ...fullCatalog,
      groups: hideModels(fullCatalog.groups, hiddenModelIds),
    }),
    [fullCatalog, hiddenModelIds],
  );
  const translator = useTranslator(draftKeptAcrossRemounts.result);
  const {result, busy, failure, clearFailure} = translator;
  const [source, setSource] = useState(draftKeptAcrossRemounts.source);
  const [promptOpen, setPromptOpen] = useState(false);
  const [swapIconFlipped, setSwapIconFlipped] = useState(false);
  const [swapCount, setSwapCount] = useState(0);
  const promptButton = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => saveDraft(source, result), [source, result]);

  const selection = resolveModelSelection(
    catalog,
    settings,
    t('effortDefault'),
  );
  const detected =
    settings.from === AUTO && source.trim() ? detectLanguage(source) : null;
  const tooLong = source.length > MAX_SOURCE_CHARS;
  const canTranslate =
    Boolean(source.trim()) && Boolean(selection.selected) && !tooLong;

  const changeSettings = (changes: Partial<Settings>) => {
    updateSettings(changes);
    clearFailure();
  };

  const swapLanguages = () => {
    setSwapIconFlipped(flipped => !flipped);
    setSwapCount(count => count + 1);
    changeSettings(swap(settings, detected, uiLanguage));
    if (result && !busy) {
      setSource(result);
      translator.setResult(source);
    }
  };

  const translate = () => {
    if (!canTranslate || busy || !selection.selected) {
      return;
    }
    const sourceLanguage =
      settings.from === AUTO ? (detected ?? AUTO) : settings.from;
    void translator.start({
      provider: selection.selected.group.id,
      model: selection.selected.model.id,
      effort: selection.requestEffort,
      text: fillPromptTemplate(
        settings.customPrompt ?? DEFAULT_PROMPT_TEMPLATE,
        sourceLanguage,
        settings.to,
        source,
      ),
    });
  };

  const clearAll = () => {
    translator.stop();
    setSource('');
    translator.setResult('');
    clearFailure();
  };

  const closePrompt = () => {
    setPromptOpen(false);
    queueMicrotask(() => promptButton.current?.focus());
  };

  return (
    <div className="dtt">
      <header className="dtt-bar">
        <h1 className="dtt-title">{t('title')}</h1>
        <ModelPicker
          catalog={catalog}
          selection={selection}
          onRetry={() => void reloadCatalog()}
          onSelectModel={key =>
            changeSettings({...parseModelKey(key), effort: ''})
          }
          onSelectEffort={effort => updateSettings({effort})}
          t={t}
        />
        <Tooltip label={t('prompt')} side="bottom" delayMs={400}>
          <button
            ref={promptButton}
            type="button"
            className="dtt-icon-btn"
            aria-label={t('prompt')}
            onClick={() => setPromptOpen(true)}
          >
            <IconSlidersTwoOutlineRegular size={16} />
          </button>
        </Tooltip>
      </header>

      {/* Swap and translate are positioned absolutely, so order sets tabbing. */}
      <div ref={card} className={clsx('dtt-card', busy && 'is-busy')}>
        <div className="dtt-lang is-source">
          <LanguagePicker
            value={settings.from}
            includeAuto
            onSelect={from => changeSettings(pickSource(from))}
            label={t('sourceLanguage')}
            swapCount={swapCount}
            swapSlideClass="from-right"
            t={t}
          />
          {detected && (
            <span key={detected} className="dtt-detected">
              {t('detected', {language: nativeNameOf(detected)})}
            </span>
          )}
        </div>
        <Tooltip label={t('swap')} side="bottom" delayMs={400}>
          <button
            type="button"
            className={clsx('dtt-swap', swapIconFlipped && 'is-flipped')}
            onClick={swapLanguages}
            aria-label={t('swap')}
          >
            <SwapIcon />
          </button>
        </Tooltip>
        <div className="dtt-lang is-target">
          <LanguagePicker
            value={settings.to}
            includeAuto={false}
            onSelect={to => changeSettings(pickTarget(settings, to))}
            label={t('targetLanguage')}
            swapCount={swapCount}
            swapSlideClass="from-left"
            t={t}
          />
        </div>
        <SourcePane
          source={source}
          tooLong={tooLong}
          swapCount={swapCount}
          onChange={setSource}
          onSubmitShortcut={busy ? translator.stop : translate}
          onClear={clearAll}
          t={t}
        />
        <TranslateButton
          busy={busy}
          justFinished={translator.justFinished}
          canTranslate={canTranslate}
          tooLong={tooLong}
          onTranslate={translate}
          onStop={translator.stop}
          t={t}
        />
        <ResultPane
          result={result}
          busy={busy}
          targetLanguage={settings.to}
          swapCount={swapCount}
          t={t}
        />
      </div>

      <PromptDialog
        open={promptOpen}
        onClose={closePrompt}
        onSave={customPrompt => {
          updateSettings({customPrompt});
          closePrompt();
        }}
        savedTemplate={settings.customPrompt}
        t={t}
      />
      {failure && (
        <FailureToast
          key={failure.id}
          error={failure.error}
          anchor={card.current}
          onDone={() => translator.dismissFailure(failure.id)}
          t={t}
        />
      )}
    </div>
  );
}
