export const releaseLinks = {
  feedbackEmail: process.env.EXPO_PUBLIC_FEEDBACK_EMAIL ?? '',
  githubUrl: process.env.EXPO_PUBLIC_GITHUB_URL ?? '',
  licensesUrl: process.env.EXPO_PUBLIC_LICENSES_URL ?? '',
  playStoreUrl:
    process.env.EXPO_PUBLIC_PLAY_STORE_URL ?? 'market://details?id=com.shahab.waterreminder',
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
} as const;
