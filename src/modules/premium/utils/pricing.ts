import { premiumConfig, type PremiumPlanId } from '@core/config/premium-config';
import type { PremiumProduct } from '../types';

export const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const getPlanPrice = (id: PremiumPlanId, products: PremiumProduct[]) => {
  const plan = premiumConfig.plans.find((item) => item.id === id)!;
  const product = products.find((item) => item.id === id);
  return (
    product ?? {
      id,
      productId: plan.productId,
      price: plan.previewPrice,
      formattedPrice: formatPrice(plan.previewPrice, premiumConfig.previewCurrency),
      currency: premiumConfig.previewCurrency,
    }
  );
};

export const getAnnualSaving = (products: PremiumProduct[]) => {
  const monthly = getPlanPrice('monthly', products);
  const yearly = getPlanPrice('yearly', products);
  // Never compare one real price against a fallback, or different currencies.
  const comparable =
    products.length === 0 ||
    (products.some((p) => p.id === 'monthly') && products.some((p) => p.id === 'yearly'));
  if (!comparable || monthly.currency !== yearly.currency || monthly.price <= 0) return 0;
  return Math.max(0, Math.floor((1 - yearly.price / (monthly.price * 12)) * 100));
};

export const getBillingDisclosure = (id: PremiumPlanId, products: PremiumProduct[]) => {
  const { formattedPrice } = getPlanPrice(id, products);
  if (id === 'lifetime') return `${formattedPrice} once. No subscription or recurring payments.`;
  return `${formattedPrice} ${id === 'monthly' ? 'per month' : 'per year'}. Renews automatically until canceled. Cancel anytime in Google Play.`;
};
