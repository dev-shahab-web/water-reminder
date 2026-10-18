import type { PremiumPlanId } from '@core/config/premium-config';

export type PremiumProduct = {
  id: PremiumPlanId;
  productId: string;
  price: number;
  formattedPrice: string;
  currency: string;
  // Only present when Play returns the configured, eligible free-trial offer.
  freeTrialDays?: number;
};

export type PremiumAccess = {
  active: boolean;
  accessUntil: number;
  productIds: string[];
};

export type PremiumCatalog = {
  products: PremiumProduct[];
  access: PremiumAccess;
  pending: boolean;
};

export type { PremiumThemeId } from '@shared/theme/premium-themes';
export type PremiumIconId = 'default' | 'midnight' | 'jade' | 'rose' | 'violet' | 'expressive';
