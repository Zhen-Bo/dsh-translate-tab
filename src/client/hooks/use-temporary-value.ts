import {useCallback, useEffect, useRef, useState} from 'react';

export function useTemporaryValue<T>(idleValue: T) {
  const [value, setValue] = useState(idleValue);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  const showFor = useCallback(
    (temporaryValue: T, durationMs: number) => {
      clearTimeout(resetTimer.current);
      setValue(temporaryValue);
      resetTimer.current = setTimeout(() => setValue(idleValue), durationMs);
    },
    [idleValue],
  );
  return [value, showFor] as const;
}
