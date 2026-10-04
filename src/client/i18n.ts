import en from '../../locale/en.json';
import zhTW from '../../locale/zh-TW.json';
import zh from '../../locale/zh.json';

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;
export type Translate = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;

const traditionalChinese: Messages = zhTW;

export const MESSAGES: Record<string, Messages> = {
  en,
  zh: zh satisfies Messages,
  'zh-TW': traditionalChinese,
  'zh-HK': traditionalChinese,
  'zh-MO': traditionalChinese,
  'zh-Hant': traditionalChinese,
};

const PLACEHOLDER = /\{(\w+)\}/g;

export function fillPlaceholders(
  template: string,
  values: Record<string, string | number> = {},
) {
  return template.replace(PLACEHOLDER, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export function createTranslate(lookup: (key: string) => string): Translate {
  return (key, values) => fillPlaceholders(lookup(key), values);
}
