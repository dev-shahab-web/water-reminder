import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps } from 'react';
import { I18nManager, StyleSheet } from 'react-native';

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

export const resolveMaterialCommunityIconName = (name: string): MaterialCommunityIconName => {
  const resolvedName = iconAliases[name] ?? name;

  if (resolvedName in MaterialCommunityIcons.glyphMap) {
    return resolvedName as MaterialCommunityIconName;
  }

  return 'information-outline';
};

export function PaperMaterialCommunityIcon({
  color,
  direction,
  name,
  size,
  testID,
}: PaperMaterialCommunityIconProps) {
  const shouldFlip = direction === 'rtl';

  return (
    <MaterialCommunityIcons
      accessibilityElementsHidden
      color={color ?? '#000000'}
      importantForAccessibility="no"
      name={resolveMaterialCommunityIconName(name)}
      size={size}
      style={shouldFlip ? styles.rtlIcon : undefined}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  rtlIcon: {
    transform: [{ scaleX: -1 }],
  },
});
