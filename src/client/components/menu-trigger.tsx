import {Menu, type MenuEntry} from '@deepseek-ai/dsh-client-ui-primitives';
import clsx from 'clsx';
import {useState, type ReactNode} from 'react';

// The host menu's own classes are generated, so selection is styled here.
export function menuItem(
  id: string,
  label: string,
  isSelected: boolean,
  leading: ReactNode = null,
): MenuEntry {
  return {
    id,
    label: (
      <span className={clsx('dtt-item', isSelected && 'is-on')}>
        {leading}
        {label}
      </span>
    ),
  };
}

export function menuGroupLabel(id: string, text: string): MenuEntry {
  return {id, type: 'label', text: <span className="dtt-group">{text}</span>};
}

export interface TriggerState {
  open: boolean;
  toggle: () => void;
}

interface MenuTriggerProps {
  renderTrigger: (state: TriggerState) => ReactNode;
  items: MenuEntry[];
  selectedId?: string;
  onSelect: (id: string) => void;
  align?: 'start' | 'end';
  compact?: boolean;
  menuClassName?: string;
  closeOnSelect?: boolean;
  children?: ReactNode;
}

export function MenuTrigger({
  renderTrigger,
  items,
  selectedId,
  onSelect,
  align = 'start',
  compact = true,
  menuClassName,
  closeOnSelect = true,
  children,
}: MenuTriggerProps) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(wasOpen => !wasOpen);
  const select = (id: string) => {
    if (closeOnSelect) {
      setOpen(false);
    }
    onSelect(id);
  };
  return (
    <Menu
      open={open}
      anchor={renderTrigger({open, toggle})}
      items={items}
      selectedId={selectedId}
      onSelect={select}
      onClose={() => setOpen(false)}
      portal
      listClassName={clsx('dtt-menu', menuClassName)}
      compact={compact}
      side="bottom"
      align={align}
    >
      {children}
    </Menu>
  );
}
