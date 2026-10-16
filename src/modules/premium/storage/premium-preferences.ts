import { getStorage } from '@platform/storage';
import type { PremiumIconId, PremiumThemeId } from '../types';

export type PremiumPreferences = { theme: PremiumThemeId; icon: PremiumIconId };
export const readPremiumPreferences = (): PremiumPreferences => {
  const theme = getStorage().getString('premiumTheme');
  const icon = getStorage().getString('premiumIcon');
  return {
    theme: theme === 'jade' || theme === 'violet' || theme === 'rose' ? theme : 'default',
    icon: icon === 'midnight' || icon === 'jade' || icon === 'rose' ? icon : 'default',
  };
};

export const persistPremiumPreferences = ({ theme, icon }: PremiumPreferences) => {
  getStorage().set('premiumTheme', theme);
  getStorage().set('premiumIcon', icon);
};
