import {useSyncExternalStore} from 'react';

import type {HostLocale} from '../host-context';

export function useActiveLocale(locale: HostLocale) {
  return useSyncExternalStore(
    listener => locale.subscribe(listener),
    () => locale.getSnapshot().active,
  );
}
