import type { QuickAddPreset } from '../types';

export const minQuickAddPresetAmountMl = 50;
export const maxQuickAddPresetAmountMl = 5000;
export const maxQuickAddPresetCount = 5;
export const defaultQuickAddPresetAmountsMl = [250, 500, 750] as const;

type QuickAddPresetInput = {
  amountMl: number;
  id?: string;
  nowIso: string;
  position: number;
};

export const createQuickAddPreset = ({
  amountMl,
  id,
  nowIso,
  position,
}: QuickAddPresetInput): QuickAddPreset => ({
  amountMl,
  createdAt: nowIso,
  id: id ?? `quick-add-${nowIso}-${position}`,
  position,
  updatedAt: nowIso,
});

export const createDefaultQuickAddPresets = (nowIso: string): QuickAddPreset[] =>
  defaultQuickAddPresetAmountsMl.map((amountMl, index) =>
    createQuickAddPreset({
      amountMl,
      id: `quick-add-default-${amountMl}`,
      nowIso,
      position: index,
    }),
  );

export const normalizeQuickAddPresets = (
  presets: readonly QuickAddPreset[],
  nowIso: string,
): QuickAddPreset[] => {
  const seenAmounts = new Set<number>();
  const normalized = presets
    .filter((preset) => isValidQuickAddAmount(preset.amountMl))
    .sort((left, right) => left.position - right.position)
    .filter((preset) => {
      if (seenAmounts.has(preset.amountMl)) {
        return false;
      }

      seenAmounts.add(preset.amountMl);
      return true;
    })
    .slice(0, maxQuickAddPresetCount)
    .map((preset, index) => ({
      ...preset,
      id: typeof preset.id === 'string' && preset.id.length > 0 ? preset.id : `quick-add-${index}`,
      position: index,
    }));

  return normalized.length > 0 ? normalized : createDefaultQuickAddPresets(nowIso);
};

export const isValidQuickAddAmount = (amountMl: number): boolean =>
  Number.isInteger(amountMl) &&
  amountMl >= minQuickAddPresetAmountMl &&
  amountMl <= maxQuickAddPresetAmountMl;

export const validateQuickAddPresetAmount = ({
  amountMl,
  currentPresetId,
  presets,
}: {
  amountMl: number;
  currentPresetId?: string;
  presets: readonly QuickAddPreset[];
}): string | undefined => {
  if (!isValidQuickAddAmount(amountMl)) {
    return `Choose an amount from ${minQuickAddPresetAmountMl} to ${maxQuickAddPresetAmountMl} ml.`;
  }

  const duplicate = presets.some(
    (preset) => preset.amountMl === amountMl && preset.id !== currentPresetId,
  );

  if (duplicate) {
    return 'That preset already exists.';
  }

  return undefined;
};
