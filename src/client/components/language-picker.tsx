import clsx from 'clsx';

import type {Translate} from '../i18n';
import {AUTO, LANGUAGES, nativeNameOf} from '../languages';
import {Chevron, LanguageTile} from './icons';
import {menuItem, MenuTrigger} from './menu-trigger';

interface LanguagePickerProps {
  value: string;
  includeAuto: boolean;
  onSelect: (languageId: string) => void;
  label: string;
  swapCount: number;
  swapSlideClass: 'from-left' | 'from-right';
  t: Translate;
}

function languageItems(selectedId: string, includeAuto: boolean, t: Translate) {
  const autoItems = includeAuto
    ? [
        menuItem(
          AUTO,
          t('auto'),
          selectedId === AUTO,
          <LanguageTile id={AUTO} />,
        ),
        {id: 'sep:auto', type: 'separator' as const},
      ]
    : [];
  const languageItems = LANGUAGES.map(language =>
    menuItem(
      language.id,
      language.nativeName,
      selectedId === language.id,
      <LanguageTile id={language.id} />,
    ),
  );
  return [...autoItems, ...languageItems];
}

export function LanguagePicker({
  value,
  includeAuto,
  onSelect,
  label,
  swapCount,
  swapSlideClass,
  t,
}: LanguagePickerProps) {
  const displayName = value === AUTO ? t('auto') : nativeNameOf(value);
  return (
    <MenuTrigger
      items={languageItems(value, includeAuto, t)}
      selectedId={value}
      onSelect={onSelect}
      compact={false}
      menuClassName="dtt-lang-menu"
      renderTrigger={({open, toggle}) => (
        <button
          type="button"
          className="dtt-lang-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
        >
          <span className="dtt-sr">{`${label}: `}</span>
          <span
            key={`swap-${swapCount}`}
            className={clsx('dtt-lang-label', swapCount > 0 && swapSlideClass)}
          >
            <LanguageTile id={value} />
            {displayName}
          </span>
          <Chevron />
        </button>
      )}
    />
  );
}
