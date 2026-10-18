import { getStorage } from '@platform/storage';
import { isPremiumThemeId } from '@shared/theme/premium-themes';
import type { PremiumIconId, PremiumThemeId } from '../types';

export type PremiumPreferences = {
  theme: PremiumThemeId;
  icon: PremiumIconId;
  dailyOffers: boolean;
};
export const readPremiumPreferences = (): PremiumPreferences => {
  const theme = getStorage().getString('premiumTheme');
  const icon = getStorage().getString('premiumIcon');
  return {
    dailyOffers: getStorage().getBoolean('premiumDailyOffers') ?? false,
    theme: isPremiumThemeId(theme) ? theme : 'default',
    icon:
      icon === 'midnight' ||
      icon === 'jade' ||
      icon === 'rose' ||
      icon === 'violet' ||
      icon === 'expressive'
        ? icon
        : 'default',
  };
};

export const persistPremiumPreferences = ({ theme, icon, dailyOffers }: PremiumPreferences) => {
  getStorage().set('premiumTheme', theme);
  getStorage().set('premiumIcon', icon);
  getStorage().set('premiumDailyOffers', dailyOffers);
};
