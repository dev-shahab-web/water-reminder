import type { PremiumPlanId } from '@core/config/premium-config';

export type PremiumProduct = {
  id: PremiumPlanId;
  productId: string;
  price: number;
  formattedPrice: string;
  currency: string;
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

export type PremiumThemeId = 'default' | 'jade' | 'violet' | 'rose';
export type PremiumIconId = 'default' | 'midnight' | 'jade' | 'rose';
