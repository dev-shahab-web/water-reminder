import type { TextStyle } from 'react-native';

export const themeFontAssets = {
  'WR-Sans-Regular': require('../../../assets/fonts/WR-Sans-Regular.ttf'),
  'WR-Sans-Semibold': require('../../../assets/fonts/WR-Sans-Semibold.ttf'),
  'WR-Sans-Bold': require('../../../assets/fonts/WR-Sans-Bold.ttf'),
  'WR-Rounded-Regular': require('../../../assets/fonts/WR-Rounded-Regular.ttf'),
  'WR-Rounded-Semibold': require('../../../assets/fonts/WR-Rounded-Semibold.ttf'),
  'WR-Rounded-Bold': require('../../../assets/fonts/WR-Rounded-Bold.ttf'),
  'WR-Serif-Regular': require('../../../assets/fonts/WR-Serif-Regular.ttf'),
  'WR-Serif-Semibold': require('../../../assets/fonts/WR-Serif-Semibold.ttf'),
  'WR-Serif-Bold': require('../../../assets/fonts/WR-Serif-Bold.ttf'),
};

export const weightedThemeFont = (family: string, weight?: TextStyle['fontWeight']) => {
  if (!family.startsWith('WR-')) return family;
  const numeric = weight === 'bold' ? 700 : Number(weight ?? 400);
  const suffix = numeric >= 700 ? 'Bold' : numeric >= 500 ? 'Semibold' : 'Regular';
  return family.replace(/-(Regular|Semibold|Bold)$/, `-${suffix}`);
};
