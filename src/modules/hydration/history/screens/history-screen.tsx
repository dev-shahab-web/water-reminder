import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AmountEntryModal } from '@modules/hydration';
import { useOnboardingState } from '@modules/onboarding';
import { AppScreen, PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { HistoryDayNavigation } from '../components/history-day-navigation';
import { HistoryDaySummary } from '../components/history-day-summary';
import { HistoryEntryList } from '../components/history-entry-list';
import { useHydrationHistory } from '../hooks/use-hydration-history';
import { isToday } from '../../utils/date';

export function HistoryScreen() {
  const theme = useTheme<AppTheme>();
  const params = useLocalSearchParams<{ date?: string }>();
  const { state } = useOnboardingState();
  const history = useHydrationHistory(state.hydrationGoal, params.date);

  const renderContent = () => {
    if (history.status === 'loading') {
      return (
        <View
          accessibilityLabel="Loading hydration history"
          accessibilityRole="progressbar"
          style={styles.state}
        >
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={[
              styles.stateText,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            Loading this day.
          </Text>
        </View>
      );
    }

    if (history.status === 'error') {
      return (
        <View style={styles.state}>
          <SectionHeader
            subtitle="Your saved hydration history should remain on this device."
            title={history.errorMessage ?? "We couldn't load this day."}
          />
          <PrimaryButton
            label="Retry"
            onPress={() => {
              void history.loadSelectedDate();
            }}
          />
        </View>
      );
    }

    if (history.entries.length === 0) {
      return (
        <View style={styles.state}>
          <SectionHeader
            subtitle={getEmptySubtitle({
              hasAnyEntries: history.hasAnyEntries,
              selectedIsToday: isToday(history.selectedDate),
            })}
            title={getEmptyTitle({
              hasAnyEntries: history.hasAnyEntries,
              selectedIsToday: isToday(history.selectedDate),
            })}
          />
          <PrimaryButton
            label="Go to Home"
            onPress={() => {
              router.push('/');
            }}
          />
        </View>
      );
    }

    return (
      <>
        <HistoryDaySummary summary={history.summary} />
        <HistoryEntryList
          entries={history.entries}
          onDeleteEntry={history.confirmDeleteEntry}
          onEditEntry={history.openEditEntry}
        />
      </>
    );
  };

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <SectionHeader
          subtitle="Review what you logged without charts or pressure."
          title="History"
        />
        <SecondaryButton
          label="Home"
          onPress={() => {
            router.push('/');
          }}
          style={styles.homeButton}
        />
      </View>

      <HistoryDayNavigation
        isFutureNextDay={history.isFutureNextDay}
        onNextDay={history.goToNextDay}
        onPreviousDay={history.goToPreviousDay}
        onToday={history.goToToday}
        selectedDate={history.selectedDate}
      />

      {renderContent()}

      <AmountEntryModal
        errorMessage={history.amountError}
        guidanceMessage={history.guidanceMessage}
        onCancel={history.closeEditEntry}
        onChangeAmount={history.changeEditAmount}
        onSave={() => {
          void history.saveEditEntry();
        }}
        saveLabel="Save changes"
        title="Edit entry"
        value={history.editAmountValue}
        visible={history.editModalVisible}
      />
    </AppScreen>
  );
}

type EmptyCopyInput = {
  hasAnyEntries: boolean;
  selectedIsToday: boolean;
};

function getEmptyTitle({ hasAnyEntries, selectedIsToday }: EmptyCopyInput): string {
  if (!hasAnyEntries) {
    return 'No history yet.';
  }

  return selectedIsToday ? 'No water logged yet today.' : 'No entries on this day.';
}

function getEmptySubtitle({ hasAnyEntries, selectedIsToday }: EmptyCopyInput): string {
  if (!hasAnyEntries) {
    return 'Your logged days will appear here after you start tracking.';
  }

  return selectedIsToday
    ? "Add your first drink to start today's progress."
    : 'Try another day or return to today.';
}

const styles = StyleSheet.create({
  header: {
    gap: 14,
  },
  homeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 640,
    width: '100%',
  },
  state: {
    gap: 16,
  },
  stateText: {
    textAlign: 'center',
  },
});
