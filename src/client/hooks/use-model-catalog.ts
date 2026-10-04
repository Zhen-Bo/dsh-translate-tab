import {useCallback, useEffect, useState} from 'react';

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

  const load = useCallback(async () => {
    setCatalog(current => ({...current, status: 'loading'}));
    try {
      const response = await ctx.remote.session.modelCatalog();
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
      setCatalog(FAILED_CATALOG);
    }
  }, [ctx]);

  useEffect(() => {
    void load();
  }, [load]);

  return [catalog, load] as const;
}
