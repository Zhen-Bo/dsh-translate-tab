export const AUTO = 'auto';

export interface Language {
  id: string;
  englishName: string;
  nativeName: string;
  scriptMark: string;
  emptyResultText: string;
}

export const LANGUAGES: readonly Language[] = [
  {
    id: 'zh-Hant',
    englishName: 'Traditional Chinese',
    nativeName: '繁體中文',
    scriptMark: '繁',
    emptyResultText: '譯文會顯示在這裡',
  },
  {
    id: 'zh-Hans',
    englishName: 'Simplified Chinese',
    nativeName: '简体中文',
    scriptMark: '简',
    emptyResultText: '译文会显示在这里',
  },
  {
    id: 'en',
    englishName: 'English',
    nativeName: 'English',
    scriptMark: 'EN',
    emptyResultText: 'The translation appears here',
  },
  {
    id: 'ja',
    englishName: 'Japanese',
    nativeName: '日本語',
    scriptMark: '日',
    emptyResultText: '翻訳がここに表示されます',
  },
  {
    id: 'ko',
    englishName: 'Korean',
    nativeName: '한국어',
    scriptMark: '한',
    emptyResultText: '번역이 여기에 표시됩니다',
  },
  {
    id: 'fr',
    englishName: 'French',
    nativeName: 'Français',
    scriptMark: 'FR',
    emptyResultText: "La traduction s'affiche ici",
  },
  {
    id: 'de',
    englishName: 'German',
    nativeName: 'Deutsch',
    scriptMark: 'DE',
    emptyResultText: 'Die Übersetzung erscheint hier',
  },
  {
    id: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    scriptMark: 'ES',
    emptyResultText: 'La traducción aparece aquí',
  },
  {
    id: 'pt',
    englishName: 'Portuguese',
    nativeName: 'Português',
    scriptMark: 'PT',
    emptyResultText: 'A tradução aparece aqui',
  },
  {
    id: 'it',
    englishName: 'Italian',
    nativeName: 'Italiano',
    scriptMark: 'IT',
    emptyResultText: 'La traduzione appare qui',
  },
  {
    id: 'ru',
    englishName: 'Russian',
    nativeName: 'Русский',
    scriptMark: 'Ру',
    emptyResultText: 'Перевод появится здесь',
  },
  {
    id: 'vi',
    englishName: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    scriptMark: 'VI',
    emptyResultText: 'Bản dịch sẽ hiển thị ở đây',
  },
  {
    id: 'th',
    englishName: 'Thai',
    nativeName: 'ไทย',
    scriptMark: 'ไท',
    emptyResultText: 'คำแปลจะแสดงที่นี่',
  },
  {
    id: 'id',
    englishName: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    scriptMark: 'ID',
    emptyResultText: 'Terjemahan muncul di sini',
  },
  {
    id: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    scriptMark: 'ع',
    emptyResultText: 'ستظهر الترجمة هنا',
  },
];

export function findLanguage(id: string) {
  return LANGUAGES.find(language => language.id === id);
}

export function englishNameOf(id: string) {
  return findLanguage(id)?.englishName ?? id;
}

export function nativeNameOf(id: string) {
  return findLanguage(id)?.nativeName ?? id;
}

const TRADITIONAL_CHINESE_LOCALE = /^zh-(tw|hk|mo|hant)/;

export function translationLanguageForLocale(localeId: string | undefined) {
  const id = (localeId ?? '').toLowerCase();
  if (!id.startsWith('zh')) {
    return 'en';
  }
  return TRADITIONAL_CHINESE_LOCALE.test(id) ? 'zh-Hant' : 'zh-Hans';
}

const DETECTION_SAMPLE_LENGTH = 400;
const DOMINANT_SCRIPT_SHARE = 0.3;
const MIN_COMMON_ENGLISH_WORD_SHARE = 0.15;
const MIN_ENGLISH_WORD_COUNT = 3;
const KANA = /[぀-ヿ]/g;
const HANGUL = /[가-힯]/g;
const ARABIC = /[؀-ۿ]/g;
const THAI = /[฀-๿]/g;
const CYRILLIC = /[Ѐ-ӿ]/g;
const HAN = /[一-鿿]/g;
const SIMPLIFIED_ONLY_HAN =
  /[这们个说为来时会对过还经发么样车门东问进书长马见]/g;
const TRADITIONAL_ONLY_HAN =
  /[這們個說為來時會對過還經發麼樣車門東問進書長馬見]/g;
const COMMON_ENGLISH_WORDS = new Set(
  'the and is are to of in that it for with you we this be on not have will can'.split(
    ' ',
  ),
);

export function detectLanguage(text: string): string | null {
  const sample = text.slice(0, DETECTION_SAMPLE_LENGTH);
  const count = (pattern: RegExp) => (sample.match(pattern) ?? []).length;
  const letterCount = count(/\p{L}/gu) || 1;
  const dominates = (pattern: RegExp) =>
    count(pattern) / letterCount > DOMINANT_SCRIPT_SHARE;

  if (count(KANA) > 0) {
    return 'ja';
  }
  if (dominates(HANGUL)) {
    return 'ko';
  }
  if (dominates(ARABIC)) {
    return 'ar';
  }
  if (dominates(THAI)) {
    return 'th';
  }
  if (dominates(CYRILLIC)) {
    return 'ru';
  }
  if (dominates(HAN)) {
    return count(SIMPLIFIED_ONLY_HAN) > count(TRADITIONAL_ONLY_HAN)
      ? 'zh-Hans'
      : 'zh-Hant';
  }

  const words = sample.toLowerCase().match(/[a-z']+/g) ?? [];
  const commonWordCount = words.filter(word =>
    COMMON_ENGLISH_WORDS.has(word),
  ).length;
  const looksEnglish =
    words.length >= MIN_ENGLISH_WORD_COUNT &&
    commonWordCount / words.length > MIN_COMMON_ENGLISH_WORD_SHARE;
  return looksEnglish ? 'en' : null;
}
