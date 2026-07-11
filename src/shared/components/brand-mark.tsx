import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { appDarkTheme, appLightTheme, type AppTheme } from '@shared/theme';

type BrandMarkProps = {
  label?: string;
  size?: number;
};

export function BrandMark({ label = 'Water Reminder', size = 112 }: BrandMarkProps) {
  const colorScheme = useColorScheme();
  const providedTheme = useTheme<Partial<AppTheme>>();
  const theme =
    providedTheme.app === undefined
      ? colorScheme === 'dark'
        ? appDarkTheme
        : appLightTheme
      : (providedTheme as AppTheme);
  const dropWidth = size * 0.38;
  const dropHeight = size * 0.56;

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
    >
      <View
        style={[
          styles.drop,
          {
            backgroundColor: theme.app.colors.hydrationProgress,
            borderBottomLeftRadius: dropWidth,
            borderBottomRightRadius: dropWidth,
            borderTopLeftRadius: dropWidth,
            height: dropHeight,
            top: size * 0.2,
            width: dropWidth,
          },
        ]}
      >
        <View
          style={[
            styles.highlight,
            {
              backgroundColor: theme.colors.primaryContainer,
              height: dropHeight * 0.22,
              width: dropWidth * 0.54,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.ripple,
          {
            borderColor: theme.app.colors.surfaceBase,
            borderRadius: size * 0.22,
            bottom: size * 0.25,
            height: size * 0.18,
            width: size * 0.52,
          },
        ]}
      />
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.spark,
          {
            color: theme.app.colors.hydrationProgress,
            fontSize: size * 0.14,
            right: size * 0.24,
            top: size * 0.17,
          },
        ]}
      >
        ~
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  highlight: {
    borderRadius: 999,
    left: '20%',
    opacity: 0.45,
    position: 'absolute',
    top: '16%',
    transform: [{ rotate: '-20deg' }],
  },
  ripple: {
    borderTopWidth: 3,
    opacity: 0.72,
    position: 'absolute',
  },
  spark: {
    fontWeight: '700',
    position: 'absolute',
  },
});
