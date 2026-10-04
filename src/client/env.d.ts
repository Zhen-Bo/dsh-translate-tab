declare module '*.css' {
  const css: string;
  export default css;
}

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type {ComponentType, ReactNode} from 'react';

  type IconComponent = ComponentType<{size?: number}>;

  export interface MenuEntry {
    id: string;
    type?: 'label' | 'separator';
    label?: ReactNode;
    text?: ReactNode;
  }

  export const Button: ComponentType<{
    variant?: 'ghost' | 'primary';
    size?: 'sm';
    icon?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    children?: ReactNode;
  }>;
  export const Menu: ComponentType<{
    open: boolean;
    anchor: ReactNode;
    items: MenuEntry[];
    selectedId?: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    portal?: boolean;
    listClassName?: string;
    compact?: boolean;
    side?: 'bottom';
    align?: 'start' | 'end';
    children?: ReactNode;
  }>;
  export const Modal: ComponentType<{
    open: boolean;
    onClose: () => void;
    title: string;
    closeLabel: string;
    className?: string;
    headless?: boolean;
    children?: ReactNode;
  }>;
  export const Toast: ComponentType<{
    anchor: Element | null;
    holdMs: number;
    icon?: ReactNode;
    text: ReactNode;
    onDone: () => void;
  }>;
  export const Tooltip: ComponentType<{
    label: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delayMs?: number;
    shortcutKeys?: readonly string[];
    disabled?: boolean;
    children: ReactNode;
  }>;
  export function writeClipboard(text: string): Promise<boolean>;

  export const IconCheckOutlineRegular: IconComponent;
  export const IconChevronDownOutlineRegular: IconComponent;
  export const IconCloseOutlineRegular: IconComponent;
  export const IconCopyOutlineRegular: IconComponent;
  export const IconGlobeOutlineRegular: IconComponent;
  export const IconRefreshOutlineRegular: IconComponent;
  export const IconSlidersTwoOutlineRegular: IconComponent;
  export const IconStopFillRegular: IconComponent;
  export const IconWarningOutlineRegular: IconComponent;
}
