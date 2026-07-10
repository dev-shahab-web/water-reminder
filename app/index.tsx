import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { appConfig } from '@core/config';
import {
  AmountEntryModal,
  HydrationRing,
  HydrationTimeline,
  QuickAddButton,
  calculateHydrationSummary,
  editHydrationEntry,
  getGreeting,
  getSuccessMicrocopy,
  loadTodayHydration,
  logHydration,
  removeHydrationEntry,
  type HydrationEntry,
  type HydrationEntrySource,
} from '@modules/hydration';
import { useOnboardingState } from '@modules/onboarding';
import {
  playDeleteConfirmationHaptic,
  playErrorHaptic,
  playGoalCompleteHaptic,
  playWaterLogHaptic,
} from '@platform/haptics';
import {
  AppScreen,
  BrandMark,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import type { AppTheme } from '@shared/theme';
import { useAppDispatch, useAppSelector } from '@state/store/hooks';

const quickAddAmounts = [250, 500, 750] as const;
const maxSingleEntryAmount = 5000;
const largeEntryAmount = 1500;

type AmountModalState = {
  entry?: HydrationEntry;
  mode: 'custom' | 'edit';
};

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();
  const { state } = useOnboardingState();
  const dispatch = useAppDispatch();
  const { entries, errorMessage, status } = useAppSelector((rootState) => rootState.hydration);
  const [amountModal, setAmountModal] = useState<AmountModalState | undefined>();
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [lastLoggedEntry, setLastLoggedEntry] = useState<HydrationEntry | undefined>();
  const [successMessage, setSuccessMessage] = useState(getGreeting());

  useEffect(() => {
    if (!state.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }

    void dispatch(loadTodayHydration());
  }, [dispatch, state.onboardingCompleted]);

  const summary = useMemo(
    () => calculateHydrationSummary(entries, state.hydrationGoal),
    [entries, state.hydrationGoal],
  );

  if (!state.onboardingCompleted) {
    return (
      <AppScreen style={styles.loadingScreen}>
        <BrandMark size={112} />
      </AppScreen>
    );
  }

  const validateAmountInput = (): number | undefined => {
    const parsedAmount = Number.parseInt(amountInput, 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Enter an amount greater than zero.');
      void playErrorHaptic();
      return undefined;
    }

    if (parsedAmount > maxSingleEntryAmount) {
      setAmountError('That amount is too large for one entry.');
      void playErrorHaptic();
      return undefined;
    }

    setAmountError(undefined);
    return parsedAmount;
  };

  const playLogFeedback = async ({
    nextTotal,
    previousTotal,
  }: {
    nextTotal: number;
    previousTotal: number;
  }) => {
    if (previousTotal < summary.goalAmount && nextTotal >= summary.goalAmount) {
      await playGoalCompleteHaptic();
      return;
    }

    await playWaterLogHaptic();
  };

  const handleLogAmount = async (
    amount: number,
    source: HydrationEntrySource,
  ): Promise<boolean> => {
    const previousTotal = summary.totalAmount;

    try {
      const entry = await dispatch(logHydration({ amount, source })).unwrap();
      const nextTotal = previousTotal + entry.amount;
      const goalReached = previousTotal < summary.goalAmount && nextTotal >= summary.goalAmount;

      setLastLoggedEntry(entry);
      setSuccessMessage(
        getSuccessMicrocopy({
          entryCount: entries.length + 1,
          goalReached,
        }),
      );

      await playLogFeedback({ nextTotal, previousTotal });
      return true;
    } catch {
      await playErrorHaptic();
      return false;
    }
  };

  const handleCustomSave = async () => {
    const amount = validateAmountInput();

    if (amount === undefined) {
      return;
    }

    if (amountModal?.mode === 'edit' && amountModal.entry !== undefined) {
      const previousTotal = summary.totalAmount;
      const nextTotal = previousTotal - amountModal.entry.amount + amount;

      try {
        const updatedEntry = await dispatch(
          editHydrationEntry({ amount, id: amountModal.entry.id }),
        ).unwrap();

        if (lastLoggedEntry?.id === updatedEntry.id) {
          setLastLoggedEntry(updatedEntry);
        }

        setSuccessMessage('Updated.');

        if (previousTotal < summary.goalAmount && nextTotal >= summary.goalAmount) {
          await playGoalCompleteHaptic();
        }
      } catch {
        await playErrorHaptic();
        return;
      }
    } else {
      const wasLogged = await handleLogAmount(amount, 'custom');

      if (!wasLogged) {
        return;
      }
    }

    setAmountModal(undefined);
    setAmountInput('');
  };

  const openCustomAmount = () => {
    setAmountError(undefined);
    setAmountInput('');
    setAmountModal({ mode: 'custom' });
  };

  const openEditEntry = (entry: HydrationEntry) => {
    setAmountError(undefined);
    setAmountInput(String(entry.amount));
    setAmountModal({ entry, mode: 'edit' });
  };

  const handleUndoRecentLog = async () => {
    if (lastLoggedEntry === undefined) {
      return;
    }

    try {
      await dispatch(removeHydrationEntry(lastLoggedEntry.id)).unwrap();
      setLastLoggedEntry(undefined);
      setSuccessMessage('Removed.');
    } catch {
      await playErrorHaptic();
    }
  };

  const confirmDeleteEntry = (entry: HydrationEntry) => {
    Alert.alert('Delete entry?', `${entry.amount} ml will be removed from today.`, [
      {
        style: 'cancel',
        text: 'Cancel',
      },
      {
        onPress: async () => {
          try {
            await dispatch(removeHydrationEntry(entry.id)).unwrap();
            await playDeleteConfirmationHaptic();
            setSuccessMessage('Entry deleted.');

            if (lastLoggedEntry?.id === entry.id) {
              setLastLoggedEntry(undefined);
            }
          } catch {
            await playErrorHaptic();
          }
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  };

  const isSaving = status === 'saving';
  const parsedAmountInput = Number.parseInt(amountInput, 10);
  const guidanceMessage =
    parsedAmountInput > largeEntryAmount
      ? 'That is a large single entry. Save it only if it reflects one drink.'
      : undefined;
  const ringMessage =
    summary.totalAmount >= summary.goalAmount
      ? "Nice work. You've finished today's hydration."
      : successMessage;

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <BrandMark size={56} />
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
      </View>

      <HydrationRing
        goalAmount={summary.goalAmount}
        message={ringMessage}
        remainingAmount={summary.remainingAmount}
        totalAmount={summary.totalAmount}
      />

      <View style={styles.metricRow}>
        <Metric label="Current" value={`${summary.totalAmount} ml`} />
        <Metric label="Remaining" value={`${summary.remainingAmount} ml`} />
        <Metric label="Goal" value={`${summary.goalAmount} ml`} />
      </View>

      {lastLoggedEntry === undefined ? null : (
        <View
          accessibilityRole="alert"
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
            {lastLoggedEntry.amount} ml logged.
          </Text>
          <SecondaryButton
            accessibilityLabel={`Undo ${lastLoggedEntry.amount} milliliter log`}
            label="Undo"
            onPress={handleUndoRecentLog}
            style={styles.undoButton}
          />
        </View>
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

      <View style={styles.section}>
        <SectionHeader
          subtitle="One tap is enough for the drinks you log most."
          title="Quick add"
        />
        <View style={styles.quickAddRow}>
          {quickAddAmounts.map((amount) => (
            <QuickAddButton
              key={amount}
              amount={amount}
              disabled={isSaving}
              onPress={() => {
                void handleLogAmount(amount, 'quick_add');
              }}
            />
          ))}
        </View>
        <PrimaryButton
          accessibilityLabel="Add a custom water amount"
          disabled={isSaving}
          label="Custom amount"
          onPress={openCustomAmount}
        />
      </View>

      <HydrationTimeline
        entries={summary.entries}
        onDeleteEntry={confirmDeleteEntry}
        onEditEntry={openEditEntry}
      />

      <AmountEntryModal
        errorMessage={amountError}
        guidanceMessage={guidanceMessage}
        onCancel={() => {
          setAmountModal(undefined);
        }}
        onChangeAmount={(value) => {
          setAmountInput(value.replace(/\D/g, ''));
          setAmountError(undefined);
        }}
        onSave={() => {
          void handleCustomSave();
        }}
        saveLabel={amountModal?.mode === 'edit' ? 'Save changes' : 'Log water'}
        title={amountModal?.mode === 'edit' ? 'Edit entry' : 'Custom amount'}
        value={amountInput}
        visible={amountModal !== undefined}
      />
    </AppScreen>
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
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: {
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 0,
    padding: 12,
  },
  metricLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricValue: {
    fontWeight: '800',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 560,
    width: '100%',
  },
  section: {
    gap: 14,
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
