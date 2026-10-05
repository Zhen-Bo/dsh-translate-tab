import type {ComponentType} from 'react';

import type {CatalogGroup, ModelSelectionDefault} from './model-selection';

export interface HostLocale {
  register(
    namespace: string,
    messages: Record<string, Record<string, string>>,
  ): () => void;
  bind(namespace: string): (key: string) => string;
  subscribe(listener: () => void): () => void;
  getSnapshot(): {active?: string};
}

export type HostResult<T> =
  {ok: true; value: T} | {ok: false; error: {code: string; message: string}};

export interface HostModelCatalog {
  groups?: CatalogGroup[];
  default?: ModelSelectionDefault;
}

interface SlotRegistration {
  name: string;
  key?: string;
  id?: string;
  order?: number;
  label?: () => string;
  locale?: string;
}

/** The parts of the host plugin context this plugin uses. */
export interface SettingsStore {
  getSnapshot(): {status: string; value?: Record<string, unknown>};
  subscribe(listener: () => void): () => void;
}

export interface SettingsScope {
  bind(options: {namespace: string}): SettingsStore;
}

export interface ConfigForms {
  get(configId: string): SettingsStore | undefined;
}

export interface HostConnection {
  rpc: {
    call(
      channel: string,
      endpoint: string,
      payload: object,
    ): Promise<HostResult<Record<string, unknown>>>;
  };
}

export interface ClientContext {
  effect(setup: () => () => void, label: string): void;
  get(name: 'configForms'): ConfigForms | undefined;
  get(name: 'connection'): HostConnection | undefined;
  get(name: 'settingsScope'): SettingsScope | undefined;
  locale: HostLocale;
  remote: {
    session: {
      modelCatalog(): Promise<HostResult<HostModelCatalog>>;
    };
  };
  slots: {
    inject(
      name: string,
      register: () => unknown | Generator<unknown, void, unknown>,
    ): void;
    register<P extends object>(
      registration: SlotRegistration,
      component: ComponentType<P>,
    ): unknown;
  };
}
