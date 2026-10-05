import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import type {HostResult, SettingsStore} from '../host-context';
import {readModelIds, type HiddenModelIds} from '../model-visibility';

export interface BoundHiddenModelSource {
  providerId: string;
  settingsField: string;
  store?: SettingsStore;
  fetchStatus: () => Promise<HostResult<Record<string, unknown>>>;
}

function readyStoreIdsOf(sources: readonly BoundHiddenModelSource[]) {
  const entries = sources.flatMap(({providerId, settingsField, store}) => {
    const snapshot = store?.getSnapshot();
    const stored = snapshot?.value?.[settingsField];
    return snapshot?.status === 'ready' && Array.isArray(stored)
      ? [[providerId, readModelIds(stored)]]
      : [];
  });
  return Object.fromEntries(entries) as HiddenModelIds;
}

function useStatusIds(sources: readonly BoundHiddenModelSource[]) {
  const [statusIds, setStatusIds] = useState<HiddenModelIds>({});
  useEffect(() => {
    let mounted = true;
    for (const {providerId, settingsField, fetchStatus} of sources) {
      fetchStatus()
        .then(response => {
          if (mounted && response.ok) {
            const ids = readModelIds(response.value[settingsField]);
            setStatusIds(current => ({...current, [providerId]: ids}));
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [sources]);
  return statusIds;
}

/** Same sources as the provider's own picker: its settings, else its status. */
export function useHiddenModelIds(sources: readonly BoundHiddenModelSource[]) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribes = sources.map(
        source => source.store?.subscribe(listener) ?? (() => {}),
      );
      return () => unsubscribes.forEach(unsubscribe => unsubscribe());
    },
    [sources],
  );
  // A string snapshot stays equal across reads, which useSyncExternalStore needs.
  const serializedStoreIds = useSyncExternalStore(subscribe, () =>
    JSON.stringify(readyStoreIdsOf(sources)),
  );
  const statusIds = useStatusIds(sources);
  return useMemo(
    (): HiddenModelIds => ({...statusIds, ...JSON.parse(serializedStoreIds)}),
    [statusIds, serializedStoreIds],
  );
}
