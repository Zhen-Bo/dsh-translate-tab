export const PROVIDER_DEFAULT_EFFORT = '__provider';
export const LET_PROVIDER_DECIDE_EFFORT = '';

// Until an effort is picked, the fastest one lets translation start at once.
const FASTEST_EFFORT_IDS = /^(off|none|disabled|minimal)$/i;

export interface CatalogEffort {
  id: string;
  name?: string;
}

export interface CatalogModel {
  id: string;
  name?: string;
  reasoning?: {efforts?: CatalogEffort[]; defaultEffort?: string};
}

export interface CatalogGroup {
  id: string;
  name?: string;
  models: CatalogModel[];
}

export interface ModelSelectionDefault {
  provider: string;
  model: string;
}

export interface ModelCatalog {
  status: 'loading' | 'ready' | 'error';
  groups: CatalogGroup[];
  defaultSelection: ModelSelectionDefault | null;
}

export interface ModelChoice {
  provider: string;
  model: string;
  effort: string;
}

export interface EffortOption {
  id: string;
  label: string;
}

export interface ModelSelection {
  hasModels: boolean;
  selected?: {group: CatalogGroup; model: CatalogModel};
  selectedKey?: string;
  requestEffort: string;
  effort: string;
  effortLabel: string;
  effortOptions: EffortOption[];
}

export function modelKeyOf(providerId: string, modelId: string) {
  return JSON.stringify([providerId, modelId]);
}

export function parseModelKey(key: string): ModelSelectionDefault {
  const [provider, model] = JSON.parse(key) as [string, string];
  return {provider, model};
}

export function modelNameOf(model: CatalogModel) {
  return model.name ?? model.id;
}

function requestEffortFor(efforts: CatalogEffort[], chosenEffort: string) {
  if (efforts.some(effort => effort.id === chosenEffort)) {
    return chosenEffort;
  }
  if (chosenEffort === PROVIDER_DEFAULT_EFFORT) {
    return LET_PROVIDER_DECIDE_EFFORT;
  }
  const fastestEffort = efforts.find(effort =>
    FASTEST_EFFORT_IDS.test(effort.id),
  );
  return fastestEffort?.id ?? LET_PROVIDER_DECIDE_EFFORT;
}

export function resolveModelSelection(
  catalog: Pick<ModelCatalog, 'groups' | 'defaultSelection'>,
  choice: ModelChoice,
  providerDefaultLabel: string,
): ModelSelection {
  const models = catalog.groups.flatMap(group =>
    group.models.map(model => ({group, model})),
  );
  const find = (providerId: string, modelId: string) =>
    models.find(
      entry => entry.group.id === providerId && entry.model.id === modelId,
    );
  const catalogDefault =
    catalog.defaultSelection &&
    find(catalog.defaultSelection.provider, catalog.defaultSelection.model);
  const selected =
    find(choice.provider, choice.model) ?? catalogDefault ?? models[0];

  const reasoning = selected?.model.reasoning;
  const efforts = reasoning?.efforts ?? [];
  const requestEffort = requestEffortFor(efforts, choice.effort);
  const effort =
    requestEffort || reasoning?.defaultEffort || PROVIDER_DEFAULT_EFFORT;
  const needsProviderDefaultOption =
    efforts.length > 0 && reasoning?.defaultEffort === undefined;
  const effortOptions: EffortOption[] = [
    ...(needsProviderDefaultOption
      ? [{id: PROVIDER_DEFAULT_EFFORT, label: providerDefaultLabel}]
      : []),
    ...efforts.map(option => ({
      id: option.id,
      label: option.name ?? option.id,
    })),
  ];

  return {
    hasModels: models.length > 0,
    selected,
    selectedKey: selected && modelKeyOf(selected.group.id, selected.model.id),
    requestEffort,
    effort,
    effortLabel:
      effortOptions.find(option => option.id === effort)?.label ?? '',
    effortOptions,
  };
}
