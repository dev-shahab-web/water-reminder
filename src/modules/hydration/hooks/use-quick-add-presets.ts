import { useCallback, useSyncExternalStore } from 'react';

import {
  addQuickAddPreset,
  getQuickAddPresets,
  moveQuickAddPreset,
  removeQuickAddPreset,
  subscribeToQuickAddPresets,
  updateQuickAddPreset,
} from '../storage/quick-add-presets-storage';

export const useQuickAddPresets = () => {
  const presets = useSyncExternalStore(
    subscribeToQuickAddPresets,
    getQuickAddPresets,
    getQuickAddPresets,
  );

  const addPreset = useCallback((amountMl: number) => addQuickAddPreset(amountMl), []);
  const updatePreset = useCallback(
    (id: string, amountMl: number) => updateQuickAddPreset(id, amountMl),
    [],
  );
  const removePreset = useCallback((id: string) => removeQuickAddPreset(id), []);
  const movePreset = useCallback(
    (id: string, direction: 'down' | 'up') => moveQuickAddPreset(id, direction),
    [],
  );

  return {
    addPreset,
    movePreset,
    presets,
    removePreset,
    updatePreset,
  };
};
