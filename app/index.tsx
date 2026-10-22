import { useAppReduceMotion } from '@shared/motion/motion-provider';
import { GlassSurface } from '@shared/components/glass-surface';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type AppStateStatus,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { Text } from '@shared/components/themed-text';
import { useTheme } from 'react-native-paper';
import { Easing, FadeInDown, FadeOutUp } from 'react-native-reanimated';

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
import { AnimatedCard, shouldUseContinuousMotion } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const { fontScale } = useWindowDimensions();
  const params = useLocalSearchParams<{ reminderPulse?: string }>();
  const { state } = useOnboardingState();
  const isFocused = useIsFocused();
  const reduceMotion = useAppReduceMotion();
  const settings = useSettingsSnapshot();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [windowFocused, setWindowFocused] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const heroBottom = useRef(Number.POSITIVE_INFINITY);
  const scrollOffset = useRef(0);
  const visibleHero = useRef(true);
  const [actionRowWidth, setActionRowWidth] = useState(0);
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
    lastLogFeedback,
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

  const handleActionRowLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    setActionRowWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const updateHeroVisibility = useCallback(() => {
    const visible = scrollOffset.current < heroBottom.current;
    // Scroll events never render the screen unless visibility changes.
    if (visible !== visibleHero.current) {
      visibleHero.current = visible;
      setHeroVisible(visible);
    }
  }, []);
  const handleHeroLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      heroBottom.current = y + height;
      updateHeroVisibility();
    },
    [updateHeroVisibility],
  );
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
      updateHeroVisibility();
    },
    [updateHeroVisibility],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    const blur = AppState.addEventListener('blur', () => setWindowFocused(false));
    const focus = AppState.addEventListener('focus', () => setWindowFocused(true));

    return () => {
      subscription.remove();
      blur.remove();
      focus.remove();
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
  const quickAddActionGap = theme.app.spacing[3];
  const isQuickAddActionRowHorizontal = actionRowWidth >= 320 && fontScale <= 1.15;
  const quickAddActionButtonWidth = isQuickAddActionRowHorizontal
    ? Math.floor((actionRowWidth - quickAddActionGap) / 2)
    : undefined;
  const quickAddActionWrapperStyle = isQuickAddActionRowHorizontal
    ? { width: quickAddActionButtonWidth }
    : styles.quickAddActionWrapperStacked;

  return (
    <AppScreen
      onScroll={handleScroll}
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
        onLayout={handleHeroLayout}
        style={[
          styles.heroCard,
          {
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
          feedback={lastLogFeedback}
          attentionKey={params.reminderPulse}
          continuousMotionEnabled={
            heroVisible &&
            windowFocused &&
            amountModal === undefined &&
            shouldUseContinuousMotion({
              appState,
              isScreenFocused: isFocused,
              reduceMotion,
            })
          }
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
      </AnimatedCard>

      {lastLoggedEntry === undefined ? null : (
        <AnimatedCard
          accessibilityRole="alert"
          entering={undoEntering}
          exiting={undoExiting}
          style={[
            styles.undoBanner,
            {
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
        </AnimatedCard>
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
          accessibilityLabel="Quick add glasses"
          contentContainerStyle={styles.quickAddList}
          data={presets}
          horizontal
          ItemSeparatorComponent={QuickAddSeparator}
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
          ListFooterComponentStyle={styles.quickAddFooter}
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
        <View
          onLayout={handleActionRowLayout}
          style={[
            styles.quickAddActions,
            isQuickAddActionRowHorizontal
              ? styles.quickAddActionsHorizontal
              : styles.quickAddActionsStacked,
            { gap: quickAddActionGap },
          ]}
        >
          <View style={quickAddActionWrapperStyle}>
            <PrimaryButton
              accessibilityLabel="Add a custom water amount"
              disabled={isSaving}
              icon="plus"
              label="Custom amount"
              labelMaxFontSizeMultiplier={1.25}
              labelNumberOfLines={1}
              onPress={openCustomAmount}
              style={styles.quickAddActionButton}
            />
          </View>
          <View style={quickAddActionWrapperStyle}>
            <SecondaryButton
              accessibilityLabel="Open hydration history"
              icon="history"
              label="Check History"
              labelMaxFontSizeMultiplier={1.25}
              labelNumberOfLines={1}
              onPress={() => {
                trackEventSafely('history_opened', { source: 'app' });
                router.push('/history' as never);
              }}
              style={styles.historyActionButton}
            />
          </View>
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

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  const theme = useTheme<AppTheme>();

  return (
    <GlassSurface
      style={[
        styles.metric,
        {
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
    </GlassSurface>
  );
}

function QuickAddSeparator() {
  return <View style={styles.quickAddSeparator} />;
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
    gap: 18,
    padding: 18,
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 0,
    minWidth: 0,
    width: '100%',
  },
  historyActionButton: {
    flexShrink: 0,
    minWidth: 0,
    width: '100%',
  },
  quickAddActions: {
    width: '100%',
  },
  quickAddActionsHorizontal: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  quickAddActionsStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  quickAddActionWrapperStacked: {
    alignSelf: 'stretch',
    width: '100%',
  },
  quickAddFooter: {
    marginLeft: 12,
  },
  quickAddList: {
    paddingVertical: 6,
    paddingRight: 20,
  },
  quickAddSeparator: {
    width: 12,
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
