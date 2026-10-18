import { forwardRef } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '@shared/theme';
import { weightedThemeFont } from '@shared/theme/theme-fonts';

export const themedTextStyle = (
  theme: AppTheme,
  style?: StyleProp<TextStyle>,
  heading = false,
): TextStyle | undefined => {
  if (!theme.app?.presentation?.fontsReady || theme.app.presentation.id === 'default')
    return undefined;
  const flat = StyleSheet.flatten(style) ?? {};
  const display = heading || (flat.fontSize ?? 0) >= 24;
  const family = flat.fontFamily ?? theme.app.typography.fontFamily[display ? 'display' : 'body'];
  // Preserve deliberately different families, e.g. a monospace diagnostic field.
  if (!family.startsWith('WR-')) return undefined;
  const weight = flat.fontWeight ?? (family.endsWith('-Bold') ? '700' : '400');
  return { fontFamily: weightedThemeFont(family, weight), fontWeight: 'normal' };
};

export const Text = forwardRef<NativeText, TextProps>(function ThemedText(
  { style, ...props },
  ref,
) {
  const theme = useTheme<AppTheme>();
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[style, themedTextStyle(theme, style, props.accessibilityRole === 'header')]}
    />
  );
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function ThemedTextInput(
  { style, ...props },
  ref,
) {
  const theme = useTheme<AppTheme>();
  return <NativeTextInput ref={ref} {...props} style={[style, themedTextStyle(theme, style)]} />;
});
