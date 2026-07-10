import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { appConfig } from '@core/config';
import { useOnboardingState } from '@modules/onboarding';
import { AppScreen, BrandMark } from '@shared/components';
import type { AppTheme } from '@shared/theme';

const homeSignals = [
  {
    label: 'Today',
    value: 'Your hydration habit is ready.',
  },
  {
    label: 'Privacy',
    value: 'No account needed.',
  },
  {
    label: 'Reminders',
    value: 'Gentle support when enabled.',
  },
] as const;

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const { state } = useOnboardingState();

  useEffect(() => {
    if (!state.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [state.onboardingCompleted]);

  if (!state.onboardingCompleted) {
    return (
      <AppScreen style={styles.screen}>
        <BrandMark size={112} />
      </AppScreen>
    );
  }

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
        accessibilityLabel="Home summary"
        style={[
          styles.summary,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <View style={styles.goalBlock}>
          <Text
            style={[
              styles.goalLabel,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.label,
                lineHeight: theme.app.typography.lineHeight.label,
              },
            ]}
          >
            Daily goal
          </Text>
          <Text
            style={[
              styles.goalValue,
              {
                color: theme.app.colors.textPrimary,
                fontFamily: theme.app.typography.fontFamily.display,
                fontSize: theme.app.typography.fontSize.title,
                lineHeight: theme.app.typography.lineHeight.title,
              },
            ]}
          >
            {state.hydrationGoal} ml
          </Text>
        </View>

        {homeSignals.map((signal) => (
          <View key={signal.label} style={styles.summaryRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: theme.app.colors.hydrationProgress,
                },
              ]}
            />
            <View style={styles.summaryCopy}>
              <Text
                style={[
                  styles.summaryLabel,
                  {
                    color: theme.app.colors.textPrimary,
                    fontSize: theme.app.typography.fontSize.label,
                    lineHeight: theme.app.typography.lineHeight.label,
                  },
                ]}
              >
                {signal.label}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: theme.app.colors.textSecondary,
                    fontSize: theme.app.typography.fontSize.caption,
                    lineHeight: theme.app.typography.lineHeight.caption,
                  },
                ]}
              >
                {signal.value}
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
  goalBlock: {
    alignItems: 'center',
    gap: 4,
  },
  goalLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalValue: {
    fontWeight: '800',
  },
  summary: {
    alignSelf: 'stretch',
    borderWidth: 1,
    gap: 18,
    maxWidth: 440,
    padding: 20,
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryValue: {},
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
