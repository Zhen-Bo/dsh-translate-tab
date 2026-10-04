import {TranslateIcon} from './components/icons';
import type {ClientContext} from './host-context';
import {PLUGIN_ID} from '../shared/plugin-id';
import {createTranslate, MESSAGES} from './i18n';
import styles from './styles.css';
import {TranslatePage} from './translate-page';

export const PANEL_ID = 'translate';

export const inject = ['slots', 'remote', 'remote.session', 'locale'];

function mountStyles() {
  const style = document.createElement('style');
  style.dataset.plugin = PLUGIN_ID;
  style.textContent = styles;
  document.head.append(style);
  return () => style.remove();
}

export function apply(ctx: ClientContext) {
  ctx.effect(mountStyles, `${PLUGIN_ID}: styles`);
  ctx.effect(
    () => ctx.locale.register(PLUGIN_ID, MESSAGES),
    `${PLUGIN_ID}: messages`,
  );
  const t = createTranslate(ctx.locale.bind(PLUGIN_ID));

  const Page = () => <TranslatePage ctx={ctx} t={t} />;
  ctx.slots.inject('main', function* () {
    yield ctx.slots.register({name: 'main', key: PANEL_ID}, Page);
  });
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 5,
        label: () => t('panel'),
        locale: PLUGIN_ID,
      },
      ({size}: {size: number}) => <TranslateIcon size={size} />,
    ),
  );
}
