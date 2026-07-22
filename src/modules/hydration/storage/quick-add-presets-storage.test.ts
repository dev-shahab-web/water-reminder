import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  addQuickAddPreset,
  getQuickAddPresets,
  moveQuickAddPreset,
  removeQuickAddPreset,
  resetQuickAddPresetsCacheForTests,
  updateQuickAddPreset,
} from './quick-add-presets-storage';

const mockStorageValues = new Map<string, boolean | number | string>();

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getBoolean: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'number' ? value : undefined;
    },
    getString: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'string' ? value : undefined;
    },
    remove: (key: string) => mockStorageValues.delete(key),
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

describe('quick add presets storage', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    resetQuickAddPresetsCacheForTests();
  });

  it('migrates to the default quick add presets when storage is empty', () => {
    expect(getQuickAddPresets().map((preset) => preset.amountMl)).toEqual([250, 500, 750]);
  });

  it('adds, edits, removes, and reorders presets with stable ids', () => {
    const afterAdd = addQuickAddPreset(1000);
    const addedPreset = afterAdd.find((preset) => preset.amountMl === 1000);

    expect(addedPreset).toBeDefined();
    expect(getQuickAddPresets().map((preset) => preset.amountMl)).toEqual([250, 500, 750, 1000]);

    if (addedPreset === undefined) {
      throw new Error('Expected added preset');
    }

    updateQuickAddPreset(addedPreset.id, 1250);
    moveQuickAddPreset(addedPreset.id, 'up');
    removeQuickAddPreset('quick-add-default-750');

    expect(getQuickAddPresets().map((preset) => preset.amountMl)).toEqual([250, 500, 1250]);
    expect(getQuickAddPresets().find((preset) => preset.amountMl === 1250)?.id).toBe(
      addedPreset.id,
    );
  });

  it('rejects duplicate, too small, too large, and sixth presets', () => {
    expect(() => addQuickAddPreset(250)).toThrow('already exists');
    expect(() => addQuickAddPreset(25)).toThrow('Choose an amount');
    expect(() => addQuickAddPreset(6000)).toThrow('Choose an amount');

    addQuickAddPreset(1000);
    addQuickAddPreset(1250);

    expect(() => addQuickAddPreset(1500)).toThrow('Keep quick add to 5 presets');
  });

  it('keeps at least one preset', () => {
    removeQuickAddPreset('quick-add-default-250');
    removeQuickAddPreset('quick-add-default-500');

    expect(() => removeQuickAddPreset('quick-add-default-750')).toThrow('at least one');
  });
});
