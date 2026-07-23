import { getStorage } from '@platform/storage';

import type { QuickAddPreset } from '../types';
import {
  createDefaultQuickAddPresets,
  createQuickAddPreset,
  maxQuickAddPresetCount,
  normalizeQuickAddPresets,
  validateQuickAddPresetAmount,
} from '../utils/quick-add-presets';

const quickAddPresetsStorageKey = 'hydrationQuickAddPresets';

const subscribers = new Set<() => void>();
let cachedPresets: QuickAddPreset[] | undefined;

const notifySubscribers = () => {
  subscribers.forEach((subscriber) => {
    subscriber();
  });
};

export const subscribeToQuickAddPresets = (subscriber: () => void): (() => void) => {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
};

const readStoredPresets = (): QuickAddPreset[] => {
  const nowIso = new Date().toISOString();
  const rawValue = getStorage().getString(quickAddPresetsStorageKey);

  if (rawValue === undefined) {
    return createDefaultQuickAddPresets(nowIso);
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return createDefaultQuickAddPresets(nowIso);
    }

    return normalizeQuickAddPresets(parsedValue as QuickAddPreset[], nowIso);
  } catch {
    return createDefaultQuickAddPresets(nowIso);
  }
};

const arePresetListsEqual = (
  left: readonly QuickAddPreset[],
  right: readonly QuickAddPreset[],
): boolean =>
  left.length === right.length &&
  left.every((leftPreset, index) => {
    const rightPreset = right[index];

    return (
      rightPreset !== undefined &&
      leftPreset.amountMl === rightPreset.amountMl &&
      leftPreset.id === rightPreset.id &&
      leftPreset.position === rightPreset.position
    );
  });

export const getQuickAddPresets = (): QuickAddPreset[] => {
  const nextPresets = readStoredPresets();

  if (cachedPresets !== undefined && arePresetListsEqual(cachedPresets, nextPresets)) {
    return cachedPresets;
  }

  cachedPresets = nextPresets;
  return cachedPresets;
};

export const setQuickAddPresets = (presets: readonly QuickAddPreset[]): QuickAddPreset[] => {
  const normalizedPresets = normalizeQuickAddPresets(presets, new Date().toISOString());

  getStorage().set(quickAddPresetsStorageKey, JSON.stringify(normalizedPresets));
  cachedPresets = normalizedPresets;
  notifySubscribers();

  return normalizedPresets;
};

export const addQuickAddPreset = (amountMl: number): QuickAddPreset[] => {
  const presets = getQuickAddPresets();
  const validationMessage = validateQuickAddPresetAmount({ amountMl, presets });

  if (validationMessage !== undefined) {
    throw new Error(validationMessage);
  }

  if (presets.length >= maxQuickAddPresetCount) {
    throw new Error(`Keep quick add to ${maxQuickAddPresetCount} presets.`);
  }

  const nowIso = new Date().toISOString();

  return setQuickAddPresets([
    ...presets,
    createQuickAddPreset({
      amountMl,
      nowIso,
      position: presets.length,
    }),
  ]);
};

export const updateQuickAddPreset = (id: string, amountMl: number): QuickAddPreset[] => {
  const presets = getQuickAddPresets();
  const validationMessage = validateQuickAddPresetAmount({
    amountMl,
    currentPresetId: id,
    presets,
  });

  if (validationMessage !== undefined) {
    throw new Error(validationMessage);
  }

  const nowIso = new Date().toISOString();

  return setQuickAddPresets(
    presets.map((preset) =>
      preset.id === id ? { ...preset, amountMl, updatedAt: nowIso } : preset,
    ),
  );
};

export const removeQuickAddPreset = (id: string): QuickAddPreset[] => {
  const presets = getQuickAddPresets();

  if (presets.length <= 1) {
    throw new Error('Keep at least one quick add preset.');
  }

  return setQuickAddPresets(presets.filter((preset) => preset.id !== id));
};

export const moveQuickAddPreset = (id: string, direction: 'down' | 'up'): QuickAddPreset[] => {
  const presets = [...getQuickAddPresets()];
  const index = presets.findIndex((preset) => preset.id === id);
  const nextIndex = direction === 'up' ? index - 1 : index + 1;

  if (index < 0 || nextIndex < 0 || nextIndex >= presets.length) {
    return presets;
  }

  const [preset] = presets.splice(index, 1);

  if (preset === undefined) {
    return presets;
  }

  presets.splice(nextIndex, 0, preset);

  return setQuickAddPresets(
    presets.map((nextPreset, position) => ({
      ...nextPreset,
      position,
    })),
  );
};

export const resetQuickAddPresetsCacheForTests = (): void => {
  cachedPresets = undefined;
};
