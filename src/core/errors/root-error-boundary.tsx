import { type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { logger } from '@core/logger';
import { BrandMark } from '@shared/components';
import { darkColors, lightColors, spacing, typography } from '@shared/theme';

export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    logger.error('Root error boundary captured an error.', { error });
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrandMark size={84} />
      <Text style={[styles.title, { color: colors.onBackground }]}>Something went wrong.</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        Please try again. Your saved hydration history should remain on this device.
      </Text>
      <Button title="Try again" onPress={retry} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
    justifyContent: 'center',
    padding: spacing[6],
  },
  message: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.title,
    textAlign: 'center',
  },
});
