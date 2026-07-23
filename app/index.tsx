import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { appConfig } from '@core/config';
import {
  AmountEntryModal,
  HydrationRing,
  QuickAddButton,
  TodayDrinksStrip,
  defaultQuickAddAmountMl,
  getGreeting,
  useHomeHydration,
  useQuickAddPresets,
} from '@modules/hydration';
import { useOnboardingState } from '@modules/onboarding';
import { CompactReminderCard, useReminders } from '@modules/reminders';
import { useSettingsSnapshot } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';
import { useStatisticsPreview } from '@modules/statistics';
import { trackEventSafely } from '@platform/telemetry';
import {
  AppScreen,
  BrandMark,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import { AnimatedCard, motionDuration, shouldUseContinuousMotion } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const params = useLocalSearchParams<{ reminderPulse?: string }>();
  const { state } = useOnboardingState();
  const isFocused = useIsFocused();
  const systemReduceMotion = useReducedMotion();
  const settings = useSettingsSnapshot();
  const reduceMotion = systemReduceMotion || settings.reduceMotion;
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const { presets } = useQuickAddPresets();
  const {
    amountError,
    amountInput,
    amountModal,
    changeAmountInput,
    closeAmountModal,
    confirmDeleteEntry,
    errorMessage,
    guidanceMessage,
    isRefreshing,
    isSaving,
    lastLoggedEntry,
    logAmount,
    openCustomAmount,
    openEditEntry,
    refreshHome,
    refreshMessage,
    saveAmount,
    successMessage,
    summary,
    undoRecentLog,
  } = useHomeHydration(state.hydrationGoal, state.onboardingCompleted, settings.measurementUnit);
  const reminders = useReminders({
    goalAmount: summary.goalAmount,
    totalAmount: summary.totalAmount,
  });
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);
  const statisticsPreview = useStatisticsPreview(summary.goalAmount, statisticsRefreshKey);

  const handleRefresh = useCallback(async () => {
    await refreshHome();
    setStatisticsRefreshKey((currentKey) => currentKey + 1);
  }, [refreshHome]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!state.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [state.onboardingCompleted]);

  if (!state.onboardingCompleted) {
    return (
      <AppScreen style={styles.loadingScreen}>
        <BrandMark size={112} />
      </AppScreen>
    );
  }

  const ringMessage =
    summary.totalAmount >= summary.goalAmount
      ? "Nice work. You've finished today's hydration."
      : successMessage;
  const undoEntering = reduceMotion
    ? undefined
    : FadeInDown.duration(180).easing(Easing.out(Easing.cubic));
  const undoExiting = reduceMotion
    ? undefined
    : FadeOutUp.duration(140).easing(Easing.out(Easing.cubic));

  return (
    <AppScreen
      refreshControl={
        <RefreshControl
          accessibilityLabel={isRefreshing ? 'Refreshing hydration data' : 'Pull to refresh'}
          colors={[theme.colors.primary]}
          onRefresh={() => {
            void handleRefresh();
          }}
          progressBackgroundColor={theme.colors.surface}
          refreshing={isRefreshing}
          tintColor={theme.colors.primary}
        />
      }
      scrollable
      style={styles.screen}
    >
      <AnimatedCard
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <BrandMark size={52} />
          <View style={styles.headerCopy}>
            <Text
              accessibilityRole="header"
              style={[
                styles.appName,
                {
                  color: theme.app.colors.textPrimary,
                  fontFamily: theme.app.typography.fontFamily.display,
                  fontSize: theme.app.typography.fontSize.title,
                  lineHeight: theme.app.typography.lineHeight.title,
                },
              ]}
            >
              {appConfig.name}
            </Text>
            <Text
              style={[
                styles.greeting,
                {
                  color: theme.app.colors.textSecondary,
                  fontSize: theme.app.typography.fontSize.body,
                  lineHeight: theme.app.typography.lineHeight.body,
                },
              ]}
            >
              {getGreeting()}
            </Text>
          </View>
          <IconButton
            accessibilityLabel="Open settings"
            icon="settings"
            onPress={() => {
              trackEventSafely('settings_opened', { source: 'app' });
              router.push('/settings' as never);
            }}
            style={styles.settingsButton}
          />
        </View>

        <HydrationRing
          attentionKey={params.reminderPulse}
          continuousMotionEnabled={shouldUseContinuousMotion({
            appState,
            isScreenFocused: isFocused,
            reduceMotion,
          })}
          goalAmount={summary.goalAmount}
          message={ringMessage}
          measurementUnit={settings.measurementUnit}
          remainingAmount={summary.remainingAmount}
          reduceMotion={reduceMotion}
          totalAmount={summary.totalAmount}
        />

        <View style={styles.metricRow}>
          <Metric
            label="Remaining"
            value={formatMeasurementAmount(summary.remainingAmount, settings.measurementUnit)}
          />
          <Metric
            label="Goal"
            value={formatMeasurementAmount(summary.goalAmount, settings.measurementUnit)}
          />
        </View>
        <CompletionProgressCard
          goalAmount={summary.goalAmount}
          measurementUnit={settings.measurementUnit}
          percent={summary.percent}
          remainingAmount={summary.remainingAmount}
          totalAmount={summary.totalAmount}
        />
      </AnimatedCard>

      {lastLoggedEntry === undefined ? null : (
        <Animated.View
          accessibilityRole="alert"
          entering={undoEntering}
          exiting={undoExiting}
          style={[
            styles.undoBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.md,
            },
          ]}
        >
          <Text
            style={[
              styles.undoCopy,
              {
                color: theme.app.colors.textPrimary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            {formatMeasurementAmount(lastLoggedEntry.amount, settings.measurementUnit)} logged.
          </Text>
          <SecondaryButton
            accessibilityLabel={`Undo ${lastLoggedEntry.amount} milliliter log`}
            label="Undo"
            onPress={undoRecentLog}
            style={styles.undoButton}
          />
        </Animated.View>
      )}

      {errorMessage === undefined ? null : (
        <Text
          accessibilityRole="alert"
          style={[
            styles.error,
            {
              color: theme.app.colors.statusError,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {errorMessage}
        </Text>
      )}

      {refreshMessage === undefined ? null : (
        <Text
          accessibilityRole="alert"
          style={[
            styles.error,
            {
              color: theme.app.colors.statusWarning,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {refreshMessage}
        </Text>
      )}

      <View style={styles.section}>
        <SectionHeader
          subtitle="One tap is enough for the drinks you log most."
          title="Quick add"
        />
        <FlatList
          accessibilityLabel="Quick add water presets"
          contentContainerStyle={styles.quickAddList}
          data={presets}
          horizontal
          keyExtractor={(preset) => preset.id}
          ListFooterComponent={
            <QuickAddButton
              measurementUnit={settings.measurementUnit}
              onPress={() => {
                router.push('/quick-add-presets' as never);
              }}
              variant={{ type: 'add' }}
            />
          }
          renderItem={({ item }) => (
            <QuickAddButton
              disabled={isSaving}
              measurementUnit={settings.measurementUnit}
              onPress={() => {
                void logAmount(item.amountMl, 'quick_add');
              }}
              variant={{ amountMl: item.amountMl, type: 'preset' }}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />
        <View style={styles.quickAddActions}>
          <PrimaryButton
            accessibilityLabel="Add a custom water amount"
            disabled={isSaving}
            icon="plus"
            label="Custom amount"
            onPress={openCustomAmount}
            style={styles.quickAddActionButton}
          />
          <SecondaryButton
            accessibilityLabel="Open hydration history"
            icon="history"
            label="Check History"
            onPress={() => {
              trackEventSafely('history_opened', { source: 'app' });
              router.push('/history' as never);
            }}
            style={styles.historyActionButton}
          />
        </View>
      </View>

      <CompactReminderCard
        enabled={reminders.preferences.enabled}
        mode={reminders.preferences.mode}
        onPause={(option) => {
          void reminders.pause(option);
        }}
        onResume={reminders.resume}
        onOpenSettings={() => {
          router.push('/settings/reminders' as never);
        }}
        onToggleEnabled={() => {
          void reminders.toggleEnabled();
        }}
        permissionMessage={reminders.permissionMessage}
        preview={reminders.preview}
        status={reminders.status}
        summary={reminders.summary}
      />

      <StatisticsPreviewCard
        currentStreak={statisticsPreview?.currentStreak ?? 0}
        measurementUnit={settings.measurementUnit}
        weeklyAverage={statisticsPreview?.weeklyAverage ?? 0}
      />

      <TodayDrinksStrip
        entries={summary.entries}
        measurementUnit={settings.measurementUnit}
        onAddDefault={() => {
          void logAmount(defaultQuickAddAmountMl, 'quick_add');
        }}
        onDeleteEntry={confirmDeleteEntry}
        onEditEntry={openEditEntry}
        onOpenHistory={() => {
          trackEventSafely('history_opened', { source: 'app' });
          router.push('/history' as never);
        }}
        totalAmount={summary.totalAmount}
      />

      <AmountEntryModal
        errorMessage={amountError}
        guidanceMessage={guidanceMessage}
        onCancel={closeAmountModal}
        onChangeAmount={changeAmountInput}
        onSave={() => {
          void saveAmount();
        }}
        saveLabel={amountModal?.mode === 'edit' ? 'Save changes' : 'Log water'}
        title={amountModal?.mode === 'edit' ? 'Edit entry' : 'Custom amount'}
        unitLabel={settings.measurementUnit}
        value={amountInput}
        visible={amountModal !== undefined}
      />
    </AppScreen>
  );
}

function StatisticsPreviewCard({
  currentStreak,
  measurementUnit,
  weeklyAverage,
}: {
  currentStreak: number;
  measurementUnit: 'ml' | 'oz';
  weeklyAverage: number;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedCard
      style={[
        styles.statisticsPreview,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <SectionHeader subtitle="A quiet look at your recent rhythm." title="Statistics" />
      <View style={styles.statisticsPreviewMetrics}>
        <Metric label="Current streak" value={`${currentStreak} days`} />
        <Metric
          label="Weekly average"
          value={formatMeasurementAmount(weeklyAverage, measurementUnit)}
        />
      </View>
      <SecondaryButton
        accessibilityLabel="Open hydration statistics"
        icon="chart-line"
        label="View statistics"
        onPress={() => {
          trackEventSafely('statistics_opened', { source: 'app' });
          router.push('/statistics' as never);
        }}
      />
    </AnimatedCard>
  );
}

function CompletionProgressCard({
  goalAmount,
  measurementUnit,
  percent,
  remainingAmount,
  totalAmount,
}: {
  goalAmount: number;
  measurementUnit: 'ml' | 'oz';
  percent: number;
  remainingAmount: number;
  totalAmount: number;
}) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const clampedPercent = Math.min(Math.max(percent, 0), 1);
  const displayedPercent = Math.round(percent * 100);
  const progress = useSharedValue(clampedPercent);

  useEffect(() => {
    progress.value = withTiming(clampedPercent, {
      duration: reduceMotion ? 0 : motionDuration.standard,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedPercent, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(progress.value, 0), 1) * 100}%`,
  }));

  return (
    <View
      accessibilityLabel={`Hydration progress, ${displayedPercent} percent complete`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: 100,
        min: 0,
        now: Math.min(Math.max(displayedPercent, 0), 100),
        text: `Hydration progress, ${displayedPercent} percent complete`,
      }}
      style={[
        styles.completionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
        },
      ]}
    >
      <View style={styles.completionHeader}>
        <Text
          style={[
            styles.completionLabel,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          Completion
        </Text>
        <Text
          style={[
            styles.completionPercent,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.body,
              lineHeight: theme.app.typography.lineHeight.body,
            },
          ]}
        >
          {displayedPercent}%
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: theme.app.colors.surfaceSubtle,
            borderRadius: theme.app.radius.full,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.app.colors.hydrationProgress,
              borderRadius: theme.app.radius.full,
            },
            fillStyle,
          ]}
        />
      </View>
      <View style={styles.completionSupportRow}>
        <Text
          style={[
            styles.completionSupport,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {formatMeasurementAmount(totalAmount, measurementUnit)} completed
        </Text>
        <Text
          style={[
            styles.completionSupport,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {totalAmount > goalAmount
            ? `${formatMeasurementAmount(totalAmount - goalAmount, measurementUnit)} over`
            : `${formatMeasurementAmount(remainingAmount, measurementUnit)} left`}
        </Text>
      </View>
    </View>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
        },
      ]}
    >
      <Text
        style={[
          styles.metricLabel,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metricValue,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.subtitle,
            lineHeight: theme.app.typography.lineHeight.subtitle,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appName: {
    fontWeight: '800',
  },
  error: {
    textAlign: 'center',
  },
  greeting: {},
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  heroCard: {
    borderWidth: 1,
    elevation: 2,
    gap: 18,
    padding: 18,
    shadowColor: '#007A8A',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCard: {
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  completionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  completionLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  completionPercent: {
    fontWeight: '800',
  },
  completionSupport: {
    fontWeight: '700',
  },
  completionSupportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  metric: {
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  metricLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricValue: {
    fontWeight: '800',
  },
  quickAddActionButton: {
    // flexBasis: 0,
    // flexGrow: 5,
    flexShrink: 1,
  },
  historyActionButton: {
    // flexBasis: 0,
    // flexGrow: 5,
    flexShrink: 1,
  },
  quickAddActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    // width: '100%',
  },
  quickAddList: {
    paddingRight: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 560,
    width: '100%',
  },
  section: {
    gap: 14,
  },
  settingsButton: {
    flexShrink: 0,
  },
  statisticsPreview: {
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  statisticsPreviewMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  undoBanner: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  undoButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  undoCopy: {
    flex: 1,
  },
});
