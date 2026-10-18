import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type ComponentProps } from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '@shared/theme';

export type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type PaperMaterialCommunityIconProps = {
  color?: string;
  direction?: 'ltr' | 'rtl';
  name: string;
  size: number;
  testID?: string;
};

const iconAliases: Record<string, MaterialCommunityIconName> = {
  back: I18nManager.isRTL ? 'arrow-right' : 'arrow-left',
  settings: 'cog-outline',
};

const materialNames: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  water: 'water-drop',
  'water-outline': 'water-drop',
  'water-plus': 'water-drop',
  'cog-outline': 'settings',
  cog: 'settings',
  'arrow-left': 'arrow-back',
  'arrow-right': 'arrow-forward',
  plus: 'add',
  minus: 'remove',
  check: 'check',
  close: 'close',
  'bell-outline': 'notifications-none',
  bell: 'notifications',
  'bell-off-outline': 'notifications-off',
  'palette-outline': 'palette',
  palette: 'palette',
  'shape-outline': 'category',
  'view-dashboard-outline': 'widgets',
  'watch-variant': 'watch',
  'chart-bar': 'bar-chart',
  'chart-box-outline': 'bar-chart',
  'chart-line': 'show-chart',
  history: 'history',
  calendar: 'calendar-month',
  'calendar-outline': 'calendar-month',
  'calendar-today': 'today',
  'clock-outline': 'schedule',
  'star-outline': 'star-outline',
  star: 'star',
  'star-four-points': 'auto-awesome',
  'lock-outline': 'lock-outline',
  'lock-open-outline': 'lock-open',
  'information-outline': 'info-outline',
  'check-circle-outline': 'check-circle-outline',
  'weather-night': 'dark-mode',
  'white-balance-sunny': 'light-mode',
  'theme-light-dark': 'contrast',
  'format-font': 'text-fields',
  'format-size': 'format-size',
  'download-outline': 'download',
  'cellphone-arrow-down': 'system-update',
  restore: 'restore',
  'message-star-outline': 'rate-review',
};

export const resolveThemeIcon = (name: string, style = 'original') => {
  const original = resolveMaterialCommunityIconName(name);
  if (style === 'material' && materialNames[original])
    return { family: 'material' as const, name: materialNames[original] };
  const candidate =
    style === 'filled' || style === 'material'
      ? original.replace(/-outline$/, '')
      : style === 'outline' && !original.endsWith('-outline')
        ? `${original}-outline`
        : original;
  return {
    family: 'community' as const,
    name:
      candidate in MaterialCommunityIcons.glyphMap
        ? (candidate as MaterialCommunityIconName)
        : original,
  };
};

export const resolveMaterialCommunityIconName = (name: string): MaterialCommunityIconName => {
  const resolvedName = iconAliases[name] ?? name;

  if (resolvedName in MaterialCommunityIcons.glyphMap) {
    return resolvedName as MaterialCommunityIconName;
  }

  return 'information-outline';
};

// Paper invokes this from a Context.Consumer callback, outside component hooks.
export function PaperMaterialCommunityIcon(props: PaperMaterialCommunityIconProps) {
  return <ThemedMaterialCommunityIcon {...props} />;
}

function ThemedMaterialCommunityIcon({
  color,
  direction,
  name,
  size,
  testID,
}: PaperMaterialCommunityIconProps) {
  const theme = useTheme<AppTheme>();
  const shouldFlip = direction === 'rtl';
  const resolved = resolveThemeIcon(name, theme.app?.presentation?.iconStyle);
  const common = {
    accessibilityElementsHidden: true,
    color: color ?? '#000000',
    importantForAccessibility: 'no' as const,
    size,
    testID,
    style: shouldFlip ? styles.rtlIcon : undefined,
  };

  if (resolved.family === 'material') return <MaterialIcons {...common} name={resolved.name} />;

  return <MaterialCommunityIcons {...common} name={resolved.name} />;
}

const styles = StyleSheet.create({
  rtlIcon: {
    transform: [{ scaleX: -1 }],
  },
});
