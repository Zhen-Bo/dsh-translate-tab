import {
  Button,
  IconRefreshOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type {MouseEvent} from 'react';

import type {Translate} from '../i18n';
import {
  modelKeyOf,
  modelNameOf,
  type ModelCatalog,
  type ModelSelection,
} from '../model-selection';
import {Chevron} from './icons';
import {menuGroupLabel, menuItem, MenuTrigger} from './menu-trigger';
import {SteppedSlider} from './stepped-slider';

interface ModelPickerProps {
  catalog: ModelCatalog;
  selection: ModelSelection;
  onRetry: () => void;
  onSelectModel: (modelKey: string) => void;
  onSelectEffort: (effort: string) => void;
  t: Translate;
}

// The host menu takes no width, so it reads one from a root custom property.
function matchMenuWidthToTrigger(event: MouseEvent<HTMLButtonElement>) {
  document.documentElement.style.setProperty(
    '--dtt-model-menu-width',
    `${event.currentTarget.offsetWidth}px`,
  );
}

export function ModelPicker({
  catalog,
  selection,
  onRetry,
  onSelectModel,
  onSelectEffort,
  t,
}: ModelPickerProps) {
  if (catalog.status === 'error') {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={<IconRefreshOutlineRegular size={14} />}
        onClick={onRetry}
      >
        {t('modelsFailed')}
      </Button>
    );
  }

  const {selected, selectedKey, effortOptions, effort, effortLabel} = selection;
  const items = catalog.groups.flatMap(group => [
    menuGroupLabel(`group:${group.id}`, group.name ?? group.id),
    ...group.models.map(model => {
      const key = modelKeyOf(group.id, model.id);
      return menuItem(key, modelNameOf(model), key === selectedKey);
    }),
  ]);
  let triggerName = t('noModels');
  if (selected) {
    triggerName = modelNameOf(selected.model);
  } else if (catalog.status === 'loading') {
    triggerName = t('modelsLoading');
  }

  return (
    <MenuTrigger
      items={items}
      selectedId={selectedKey}
      menuClassName="dtt-model-menu"
      onSelect={onSelectModel}
      closeOnSelect={false}
      align="end"
      renderTrigger={({open, toggle}) => (
        <button
          type="button"
          className="dtt-model"
          disabled={!selection.hasModels}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={event => {
            matchMenuWidthToTrigger(event);
            toggle();
          }}
        >
          <span className="dtt-sr">{`${t('model')}: `}</span>
          <span className="dtt-model-name">{triggerName}</span>
          {effortLabel && (
            <span className="dtt-model-effort">
              <span className="dtt-sr">{`, ${t('effort')}: `}</span>
              {effortLabel}
            </span>
          )}
          <Chevron />
        </button>
      )}
    >
      {effortOptions.length > 0 && (
        <SteppedSlider
          key={selectedKey}
          options={effortOptions}
          value={effort}
          label={t('effort')}
          onChange={onSelectEffort}
        />
      )}
    </MenuTrigger>
  );
}
