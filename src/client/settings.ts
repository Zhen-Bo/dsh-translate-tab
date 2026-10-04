import {PLUGIN_ID} from '../shared/plugin-id';
import {AUTO} from './languages';

const SETTINGS_KEY = `${PLUGIN_ID}:v1`;
const DRAFT_KEY = `${PLUGIN_ID}:draft`;

export interface Settings {
  from: string;
  to: string;
  lastFrom: string;
  provider: string;
  model: string;
  effort: string;
  customPrompt: string | null;
}

const DEFAULT_SETTINGS: Settings = {
  from: AUTO,
  to: 'en',
  lastFrom: '',
  provider: '',
  model: '',
  effort: '',
  customPrompt: null,
};

// Reading storage throws when site data is blocked, so every access is guarded.
function storageNamed(name: 'localStorage' | 'sessionStorage') {
  try {
    return window[name];
  } catch {
    return null;
  }
}

const localStore = storageNamed('localStorage');
const sessionStore = storageNamed('sessionStorage');

function readItem(storage: Storage | null, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function tryWriteItem(storage: Storage | null, key: string, value: string) {
  try {
    if (value) {
      storage?.setItem(key, value);
    } else {
      storage?.removeItem(key);
    }
    return true;
  } catch {
    return false;
  }
}

function parseStoredSettings(raw: string | null): Partial<Settings> {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function loadSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...parseStoredSettings(readItem(localStore, SETTINGS_KEY)),
  };
}

export function saveSettings(settings: Settings) {
  tryWriteItem(localStore, SETTINGS_KEY, JSON.stringify(settings));
}

export const draftKeptAcrossRemounts = {
  source: readItem(sessionStore, DRAFT_KEY) ?? '',
  result: '',
};

export function saveDraft(source: string, result: string) {
  draftKeptAcrossRemounts.source = source;
  draftKeptAcrossRemounts.result = result;
  tryWriteItem(sessionStore, DRAFT_KEY, source);
}
