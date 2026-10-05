import {useCallback, useEffect, useRef, useState} from 'react';

import type {ClientContext} from '../host-context';
import type {ModelCatalog} from '../model-selection';

const LOADING_CATALOG: ModelCatalog = {
  status: 'loading',
  groups: [],
  defaultSelection: null,
};
const FAILED_CATALOG: ModelCatalog = {
  status: 'error',
  groups: [],
  defaultSelection: null,
};

// Host services are proxies, so ctx.remote is a new object on every read.
export function useModelCatalog(ctx: ClientContext) {
  const [catalog, setCatalog] = useState(LOADING_CATALOG);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    const isLatest = () => requestId === latestRequestId.current;
    setCatalog(current => ({...current, status: 'loading'}));
    try {
      const response = await ctx.remote.session.modelCatalog();
      if (!isLatest()) {
        return;
      }
      setCatalog(
        response.ok
          ? {
              status: 'ready',
              groups: response.value.groups ?? [],
              defaultSelection: response.value.default ?? null,
            }
          : FAILED_CATALOG,
      );
    } catch {
      if (isLatest()) {
        setCatalog(FAILED_CATALOG);
      }
    }
  }, [ctx]);

  useEffect(() => {
    void load();
    return () => {
      latestRequestId.current++;
    };
  }, [load]);

  return [catalog, load] as const;
}
