import type {CatalogGroup} from './model-selection';

export interface HiddenModelSource {
  providerId: string;
  configId: string;
  settingsField: string;
  statusEndpoint: string;
}

// Providers that keep their own hidden-model list, as their chat pickers do.
export const HIDDEN_MODEL_SOURCES: readonly HiddenModelSource[] = [
  {
    providerId: 'openai-codex',
    configId: 'codex-subscription',
    settingsField: 'disabledModels',
    statusEndpoint: 'codex-subscription/preferences/status',
  },
];

export type HiddenModelIds = Readonly<Record<string, readonly string[]>>;

export function readModelIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((id): id is string => typeof id === 'string');
}

export function hideModels(
  groups: CatalogGroup[],
  hiddenIds: HiddenModelIds,
): CatalogGroup[] {
  return groups.flatMap(group => {
    const hidden = new Set(hiddenIds[group.id] ?? []);
    if (hidden.size === 0) {
      return [group];
    }
    const models = group.models.filter(model => !hidden.has(model.id));
    return models.length > 0 ? [{...group, models}] : [];
  });
}
