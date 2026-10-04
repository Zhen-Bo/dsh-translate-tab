import {
  IconChevronDownOutlineRegular,
  IconGlobeOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives';

import {AUTO, findLanguage} from '../languages';

interface LineIconProps {
  size: number;
  strokeWidth?: number;
  paths: readonly string[];
}

function LineIcon({size, strokeWidth = 1.6, paths}: LineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map(d => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const TRANSLATE_PATHS = [
  'm5 8 6 6',
  'm4 14 6-6 2-3',
  'M2 5h12',
  'M7 2h1',
  'm22 22-5-10-5 10',
  'M14 18h6',
];
const SWAP_PATHS = ['m16 3 4 4-4 4', 'M20 7H4', 'm8 21-4-4 4-4', 'M4 17h16'];
const SEND_PATHS = ['M5 12h14', 'm13 6 6 6-6 6'];

export function TranslateIcon({size = 18}: {size?: number}) {
  return <LineIcon size={size} paths={TRANSLATE_PATHS} />;
}

export function SwapIcon() {
  return <LineIcon size={16} paths={SWAP_PATHS} />;
}

export function SendIcon() {
  return <LineIcon size={18} strokeWidth={2} paths={SEND_PATHS} />;
}

export function Chevron() {
  return <IconChevronDownOutlineRegular size={12} />;
}

function scriptMarkOf(languageId: string) {
  return (
    findLanguage(languageId)?.scriptMark ?? languageId.slice(0, 2).toUpperCase()
  );
}

export function LanguageTile({id}: {id: string}) {
  return (
    <span className="dtt-tile" aria-hidden="true">
      {id === AUTO ? <IconGlobeOutlineRegular size={13} /> : scriptMarkOf(id)}
    </span>
  );
}
