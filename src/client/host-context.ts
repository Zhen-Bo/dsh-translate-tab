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
export interface ClientContext {
  effect(setup: () => () => void, label: string): void;
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
