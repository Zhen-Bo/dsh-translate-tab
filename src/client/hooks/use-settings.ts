import {useCallback, useEffect, useState} from 'react';

import {loadSettings, saveSettings, type Settings} from '../settings';

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);
  useEffect(() => saveSettings(settings), [settings]);
  const updateSettings = useCallback(
    (changes: Partial<Settings>) =>
      setSettings(current => ({...current, ...changes})),
    [],
  );
  return [settings, updateSettings] as const;
}
