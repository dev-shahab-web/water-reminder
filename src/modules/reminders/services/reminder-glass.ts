import { getQuickAddPresets } from '@modules/hydration/storage/quick-add-presets-storage';
import { formatGlassCapacity } from '@modules/hydration/utils/glass-options';
import { getSettingsState } from '@modules/settings/storage/settings-storage';

// The first glass is the user's default on Home and in notifications.
export const getReminderGlass = () => {
  const amountMl = getQuickAddPresets()[0]?.amountMl ?? 250;
  return {
    amountMl,
    amountLabel: formatGlassCapacity(amountMl, getSettingsState().measurementUnit),
  };
};
