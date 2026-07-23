import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountEntryModal } from '@modules/hydration';
import { useOnboardingState } from '@modules/onboarding';
import { useSettingsSnapshot } from '@modules/settings';
import { AppScreen, IconButton, PrimaryButton, SectionHeader } from '@shared/components';
import { EmptyState, SkeletonCard } from '@shared/motion';

import { HistoryDayNavigation } from '../components/history-day-navigation';
import { HistoryDaySummary } from '../components/history-day-summary';
import { HistoryEntryList } from '../components/history-entry-list';
import { useHydrationHistory } from '../hooks/use-hydration-history';
import { isToday } from '../../utils/date';

export function HistoryScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const { state } = useOnboardingState();
  const settings = useSettingsSnapshot();
  const history = useHydrationHistory(state.hydrationGoal, settings.measurementUnit, params.date);

  const renderContent = () => {
    if (history.status === 'loading') {
      return (
        <View
          accessibilityLabel="Loading hydration history"
          accessibilityRole="progressbar"
          style={styles.state}
        >
          <SkeletonCard rows={2} />
          <SkeletonCard rows={3} />
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
          <EmptyState
            actionLabel="Go to Home"
            message={getEmptySubtitle({
              hasAnyEntries: history.hasAnyEntries,
              selectedIsToday: isToday(history.selectedDate),
            })}
            onAction={() => {
              router.push('/');
            }}
            title={getEmptyTitle({
              hasAnyEntries: history.hasAnyEntries,
              selectedIsToday: isToday(history.selectedDate),
            })}
            variant="history"
          />
        </View>
      );
    }

    return (
      <>
        <HistoryDaySummary measurementUnit={settings.measurementUnit} summary={history.summary} />
        <HistoryEntryList
          entries={history.entries}
          measurementUnit={settings.measurementUnit}
          onDeleteEntry={history.confirmDeleteEntry}
          onEditEntry={history.openEditEntry}
        />
      </>
    );
  };

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        />
        <SectionHeader
          subtitle="Review what you logged without charts or pressure."
          title="History"
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
        unitLabel={settings.measurementUnit}
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
  backButton: {
    alignSelf: 'flex-start',
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 640,
    width: '100%',
  },
  state: {
    gap: 16,
  },
});
