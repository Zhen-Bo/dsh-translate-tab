import {describe, expect, it} from 'vitest';

import {explainFailure} from '../src/client/failure';
import {createTranslate, fillPlaceholders, MESSAGES} from '../src/client/i18n';
import {pickSource, pickTarget, swap} from '../src/client/language-choice';
import {
  detectLanguage,
  translationLanguageForLocale,
} from '../src/client/languages';
import {
  modelKeyOf,
  PROVIDER_DEFAULT_EFFORT,
  resolveModelSelection,
} from '../src/client/model-selection';
import {
  DEFAULT_PROMPT_TEMPLATE,
  fillPromptTemplate,
  promptToStore,
} from '../src/client/prompt';
import {countCharacters} from '../src/client/text-input';
import {TranslateError} from '../src/client/translate-api';

describe('detectLanguage', () => {
  it('reads the script', () => {
    expect(detectLanguage('こんにちは世界')).toBe('ja');
    expect(detectLanguage('안녕하세요')).toBe('ko');
    expect(detectLanguage('Привет, как дела')).toBe('ru');
    expect(detectLanguage('這個問題我們會說明')).toBe('zh-Hant');
    expect(detectLanguage('这个问题我们会说明')).toBe('zh-Hans');
  });

  it('needs common words to call text English', () => {
    expect(detectLanguage('This is the plan for the week')).toBe('en');
    expect(detectLanguage('Bonjour tout le monde')).toBeNull();
  });
});

describe('fillPromptTemplate', () => {
  it('fills languages and leaves tokens inside the text alone', () => {
    const prompt = fillPromptTemplate(
      '{{source_language}} to {{target_language}}: {{text}}',
      'ja',
      'en',
      'literal {{target_language}} and $&',
    );
    expect(prompt).toBe(
      'Japanese to English: literal {{target_language}} and $&',
    );
  });

  it('appends the text when the template has no slot for it', () => {
    expect(
      fillPromptTemplate('Into {{target_language}}', 'auto', 'fr', 'hi'),
    ).toBe('Into French\n\nhi');
  });

  it('stores null for the default or an empty prompt', () => {
    expect(promptToStore(`${DEFAULT_PROMPT_TEMPLATE}\n`)).toBeNull();
    expect(promptToStore('   ')).toBeNull();
    expect(promptToStore('Custom')).toBe('Custom');
  });
});

describe('resolveModelSelection', () => {
  const catalog = {
    groups: [
      {
        id: 'ds',
        models: [
          {id: 'chat'},
          {
            id: 'r1',
            reasoning: {efforts: [{id: 'off'}, {id: 'high', name: 'High'}]},
          },
        ],
      },
    ],
    defaultSelection: {provider: 'ds', model: 'r1'},
  };
  const noChoice = {provider: '', model: '', effort: ''};

  it('follows the catalog default with the fastest effort', () => {
    const selection = resolveModelSelection(catalog, noChoice, 'Default');
    expect(selection.selectedKey).toBe(modelKeyOf('ds', 'r1'));
    expect(selection.requestEffort).toBe('off');
    expect(selection.effortOptions.map(option => option.id)).toEqual([
      PROVIDER_DEFAULT_EFFORT,
      'off',
      'high',
    ]);
  });

  it('sends no effort when the provider default is picked', () => {
    const selection = resolveModelSelection(
      catalog,
      {provider: 'ds', model: 'r1', effort: PROVIDER_DEFAULT_EFFORT},
      'Default',
    );
    expect(selection.requestEffort).toBe('');
    expect(selection.effortLabel).toBe('Default');
  });

  it('selects nothing in an empty catalog', () => {
    const empty = {groups: [], defaultSelection: null};
    const selection = resolveModelSelection(empty, noChoice, 'Default');
    expect(selection.hasModels).toBe(false);
    expect(selection.selected).toBeUndefined();
  });
});

describe('language choice', () => {
  it('swaps a detected source into the target', () => {
    expect(swap({from: 'auto', to: 'en', lastFrom: ''}, 'ja', 'en')).toEqual({
      from: 'en',
      to: 'ja',
      lastFrom: 'en',
    });
  });

  it('falls back to the last source, then the UI language', () => {
    const pair = {from: 'auto', to: 'en', lastFrom: 'de'};
    const withoutLastSource = {...pair, lastFrom: ''};
    expect(swap(pair, null, 'zh-Hant').to).toBe('de');
    expect(swap(withoutLastSource, null, 'zh-Hant').to).toBe('zh-Hant');
    expect(swap(withoutLastSource, null, 'en').to).toBe('en');
  });

  it('swaps when the target is set to the source', () => {
    expect(pickTarget({from: 'ja', to: 'en', lastFrom: ''}, 'ja')).toEqual({
      to: 'ja',
      from: 'en',
    });
    expect(pickSource('auto')).toEqual({from: 'auto'});
    expect(pickSource('ko')).toEqual({from: 'ko', lastFrom: 'ko'});
  });
});

describe('i18n', () => {
  it('has the same keys in every locale file', () => {
    const englishKeys = Object.keys(MESSAGES.en).sort();
    for (const messages of Object.values(MESSAGES)) {
      expect(Object.keys(messages).sort()).toEqual(englishKeys);
    }
  });

  it('fills placeholders and keeps unknown ones', () => {
    expect(fillPlaceholders('{a} and {b}', {a: 1})).toBe('1 and {b}');
  });

  it('maps host locales to a translation language', () => {
    expect(translationLanguageForLocale('zh-TW')).toBe('zh-Hant');
    expect(translationLanguageForLocale('zh-CN')).toBe('zh-Hans');
    expect(translationLanguageForLocale('fr')).toBe('en');
    expect(translationLanguageForLocale(undefined)).toBe('en');
  });

  it('explains common failures', () => {
    const t = createTranslate(
      key => MESSAGES.en[key as keyof typeof MESSAGES.en],
    );
    const titleOf = (error: unknown) => explainFailure(error, t).title;
    expect(titleOf(new Error('HTTP 429'))).toBe(MESSAGES.en.errorRateTitle);
    expect(titleOf(new Error('MISSING_CREDENTIAL'))).toBe(
      MESSAGES.en.errorCredentialTitle,
    );
    expect(titleOf(new TranslateError('x', 'cutoff'))).toBe(
      MESSAGES.en.errorCutoffTitle,
    );
    expect(titleOf('weird')).toBe(MESSAGES.en.errorGenericTitle);
    expect(explainFailure(new Error('text exceeds 9 characters'), t).hint).toBe(
      'Translate at most 100,000 characters at a time.',
    );
  });

  it('counts an emoji with a skin tone as one character', () => {
    expect(countCharacters('👍🏽a')).toBe(2);
  });
});
