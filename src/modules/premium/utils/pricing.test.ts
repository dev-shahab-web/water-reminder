import { describe, expect, it } from '@jest/globals';
import { premiumConfig } from '@core/config/premium-config';
import type { PremiumProduct } from '../types';
import { getAnnualSaving, getBillingDisclosure, getPlanPrice } from './pricing';

const product = (id: PremiumProduct['id'], price: number, currency = 'USD'): PremiumProduct => ({
  id,
  price,
  currency,
  productId: `store_${id}`,
  formattedPrice: `${currency} ${price.toFixed(2)}`,
});

describe('paywall pricing', () => {
  it('uses Play-confirmed trials with the full localized renewal amount', () => {
    for (const id of ['monthly', 'yearly'] as const) {
      const local = { ...product(id, 199, 'INR'), freeTrialDays: 7 };
      const copy = getBillingDisclosure(id, [local]);
      expect(copy).toContain(
        `7 days free, then INR 199.00 per ${id === 'monthly' ? 'month' : 'year'}`,
      );
      expect(copy).toContain('Cancel in Google Play before the trial ends');
    }
  });

  it('does not invent a trial from configuration or an ineligible base plan', () => {
    expect(getBillingDisclosure('monthly', [])).not.toContain('days free');
    expect(getBillingDisclosure('yearly', [product('yearly', 12.99)])).not.toContain('days free');
  });
  it('uses the exact localized Google Play price instead of the USD preview', () => {
    const local = { ...product('monthly', 199, 'INR'), formattedPrice: '₹199.00' };
    expect(getPlanPrice('monthly', [local])).toEqual(local);
  });

  it('reads preview prices from the central config', () => {
    for (const plan of premiumConfig.plans) {
      expect(getPlanPrice(plan.id, []).price).toBe(plan.previewPrice);
      expect(getPlanPrice(plan.id, []).currency).toBe(premiumConfig.previewCurrency);
    }
  });

  it('does not overstate the percentage saved', () => {
    expect(getAnnualSaving([product('monthly', 1.99), product('yearly', 12.99)])).toBe(45);
  });

  it('never mixes currencies when calculating a discount', () => {
    expect(getAnnualSaving([product('monthly', 10, 'USD'), product('yearly', 10, 'EUR')])).toBe(0);
  });

  it('does not compare real pricing to a fallback when one base plan is unavailable', () => {
    expect(getAnnualSaving([product('monthly', 100)])).toBe(0);
    expect(getAnnualSaving([product('yearly', 1)])).toBe(0);
  });

  it('does not advertise a discount for a more expensive annual plan or a zero monthly price', () => {
    expect(getAnnualSaving([product('monthly', 5), product('yearly', 80)])).toBe(0);
    expect(getAnnualSaving([product('monthly', 0), product('yearly', 10)])).toBe(0);
  });

  it('discloses the full recurring annual charge, not just the monthly equivalent', () => {
    const disclosure = getBillingDisclosure('yearly', [product('yearly', 12.99)]);
    expect(disclosure).toContain('USD 12.99 per year');
    expect(disclosure).toContain('Renews automatically');
    expect(disclosure).toContain('Cancel anytime in Google Play');
  });

  it('describes lifetime as a single payment without subscription renewal', () => {
    expect(getBillingDisclosure('lifetime', [product('lifetime', 29.99)])).toBe(
      'USD 29.99 once. No subscription or recurring payments.',
    );
  });
});
