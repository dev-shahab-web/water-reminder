import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { appConfig } from '@core/config';
import { AppScreen, BrandMark } from '@shared/components';
import type { AppTheme } from '@shared/theme';

const foundationPrinciples = [
  {
    label: 'Offline-first',
    value: 'Core experience works without internet.',
  },
  {
    label: 'Privacy-first',
    value: 'No mandatory accounts or unnecessary data.',
  },
  {
    label: 'Calm by design',
    value: 'Useful, quiet, and respectful from launch.',
  },
] as const;

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.hero}>
        <BrandMark size={132} />
        <View style={styles.wordmark}>
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              {
                color: theme.app.colors.textPrimary,
                fontFamily: theme.app.typography.fontFamily.display,
                fontSize: theme.app.typography.fontSize.display,
                lineHeight: theme.app.typography.lineHeight.display,
              },
            ]}
          >
            {appConfig.name}
          </Text>
          <Text
            style={[
              styles.motto,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.subtitle,
                lineHeight: theme.app.typography.lineHeight.subtitle,
              },
            ]}
          >
            {appConfig.motto}
          </Text>
        </View>
      </View>

      <View
        accessibilityLabel="Experience foundation"
        style={[
          styles.principles,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        {foundationPrinciples.map((principle) => (
          <View key={principle.label} style={styles.principleRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: theme.app.colors.hydrationProgress,
                },
              ]}
            />
            <View style={styles.principleCopy}>
              <Text
                style={[
                  styles.principleLabel,
                  {
                    color: theme.app.colors.textPrimary,
                    fontSize: theme.app.typography.fontSize.label,
                    lineHeight: theme.app.typography.lineHeight.label,
                  },
                ]}
              >
                {principle.label}
              </Text>
              <Text
                style={[
                  styles.principleValue,
                  {
                    color: theme.app.colors.textSecondary,
                    fontSize: theme.app.typography.fontSize.caption,
                    lineHeight: theme.app.typography.lineHeight.caption,
                  },
                ]}
              >
                {principle.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  hero: {
    alignItems: 'center',
    gap: 24,
  },
  motto: {
    textAlign: 'center',
  },
  principleCopy: {
    flex: 1,
    gap: 2,
  },
  principleLabel: {
    fontWeight: '700',
  },
  principleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  principleValue: {},
  principles: {
    alignSelf: 'stretch',
    borderWidth: 1,
    gap: 16,
    maxWidth: 440,
    padding: 20,
  },
  screen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  wordmark: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 360,
  },
});
