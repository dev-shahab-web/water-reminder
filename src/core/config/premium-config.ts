export type PremiumPlanId = 'monthly' | 'yearly' | 'lifetime';

// Edit merchandising and USD preview prices here. Google Play is the authority
// for the localized amount actually displayed and charged at checkout.
export const premiumConfig = {
  name: 'Water Reminder Plus',
  defaultPlan: 'yearly' as PremiumPlanId,
  previewCurrency: 'USD',
  playPublicKey: process.env.EXPO_PUBLIC_PLAY_BILLING_PUBLIC_KEY ?? '',
  offlineAccessHours: 24,
  promotions: {
    websiteUrl: 'https://lumarcstudio.com/apps/water-reminder/',
    dailyReminder: {
      enabled: true,
      hour: 18,
      minute: 0,
      title: 'Make Water Reminder yours',
      body: 'Unlock home screen widgets, exclusive themes and premium app icons with Plus. Explore your plans.',
    },
  },
  features: {
    widgets: {
      title: 'Home screen widgets',
      description: 'Your daily progress, one tap away.',
      icon: 'view-dashboard-outline',
      available: true,
    },
    wearOs: {
      title: 'Wear OS companion',
      description: 'A little hydration help on your wrist.',
      icon: 'watch-variant',
      available: false,
    },
    icons: {
      title: 'Premium app icons',
      description: 'A fresh look for your home screen.',
      icon: 'shape-outline',
      available: true,
    },
    themes: {
      title: 'Exclusive themes',
      description: 'Expressive colors, fonts and icons, made yours.',
      icon: 'palette-outline',
      available: true,
    },
  },
  plans: [
    {
      id: 'monthly',
      title: 'Monthly',
      productId: 'water_reminder_plus',
      basePlanId: 'monthly',
      type: 'subs',
      period: 'P1M',
      previewPrice: 1.99,
      trial: { offerId: 'trial-7-days', days: 7 },
    },
    {
      id: 'yearly',
      title: 'Yearly',
      productId: 'water_reminder_plus',
      basePlanId: 'yearly',
      type: 'subs',
      period: 'P1Y',
      previewPrice: 12.99,
      trial: { offerId: 'trial-7-days', days: 7 },
    },
    {
      id: 'lifetime',
      title: 'One-time',
      productId: 'water_reminder_plus_lifetime',
      basePlanId: '',
      type: 'inapp',
      period: '',
      previewPrice: 29.99,
    },
  ] satisfies {
    id: PremiumPlanId;
    title: string;
    productId: string;
    basePlanId: string;
    type: 'subs' | 'inapp';
    period: string;
    previewPrice: number;
    trial?: { offerId: string; days: number };
  }[],
} as const;

export type PremiumFeature = keyof typeof premiumConfig.features;
