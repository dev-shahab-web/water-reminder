import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  playDeleteConfirmationHaptic,
  playErrorHaptic,
  playGoalCompleteHaptic,
  playWaterLogHaptic,
} from '@platform/haptics';
import { trackEventSafely } from '@platform/telemetry';
import { useAppDispatch, useAppSelector } from '@state/store/hooks';

import {
  editHydrationEntry,
  loadTodayHydration,
  logHydration,
  refreshHomeHydration,
  removeHydrationEntry,
} from '../state/hydration-slice';
import type { HydrationEntry, HydrationEntrySource } from '../types';
import { getGreeting } from '../utils/date';
import { trackHydrationLogSuccess } from '../utils/hydration-telemetry';
import { calculateHydrationSummary, getSuccessMicrocopy } from '../utils/summary';

const maxSingleEntryAmount = 5000;
const largeEntryAmount = 1500;

type AmountModalState = {
  entry?: HydrationEntry;
  mode: 'custom' | 'edit';
};

export const useHomeHydration = (goalAmount: number, enabled: boolean) => {
  const dispatch = useAppDispatch();
  const { entries, errorMessage, status } = useAppSelector((rootState) => rootState.hydration);
  const [amountModal, setAmountModal] = useState<AmountModalState | undefined>();
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [lastLoggedEntry, setLastLoggedEntry] = useState<HydrationEntry | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState(getGreeting());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void dispatch(loadTodayHydration());
  }, [dispatch, enabled]);

  const summary = useMemo(
    () => calculateHydrationSummary(entries, goalAmount),
    [entries, goalAmount],
  );

  const validateAmountInput = useCallback((): number | undefined => {
    const parsedAmount = Number.parseInt(amountInput, 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Enter an amount greater than zero.');
      void playErrorHaptic();
      return undefined;
    }

    if (parsedAmount > maxSingleEntryAmount) {
      setAmountError('That is more than one entry can log.');
      void playErrorHaptic();
      return undefined;
    }

    setAmountError(undefined);
    return parsedAmount;
  }, [amountInput]);

  const playLogFeedback = useCallback(
    async ({ nextTotal, previousTotal }: { nextTotal: number; previousTotal: number }) => {
      if (previousTotal < summary.goalAmount && nextTotal >= summary.goalAmount) {
        await playGoalCompleteHaptic();
        return;
      }

      await playWaterLogHaptic();
    },
    [summary.goalAmount],
  );

  const logAmount = useCallback(
    async (amount: number, source: HydrationEntrySource): Promise<boolean> => {
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
        trackHydrationLogSuccess({
          goalAmount: summary.goalAmount,
          nextTotal,
          previousTotal,
          source,
        });

        await playLogFeedback({ nextTotal, previousTotal });
        return true;
      } catch {
        await playErrorHaptic();
        return false;
      }
    },
    [dispatch, entries.length, playLogFeedback, summary.goalAmount, summary.totalAmount],
  );

  const saveAmount = useCallback(async () => {
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
          trackHydrationLogSuccess({
            goalAmount: summary.goalAmount,
            nextTotal,
            previousTotal,
            source: 'edit',
          });
          await playGoalCompleteHaptic();
        }
      } catch {
        await playErrorHaptic();
        return;
      }
    } else {
      const wasLogged = await logAmount(amount, 'custom');

      if (!wasLogged) {
        return;
      }
    }

    setAmountModal(undefined);
    setAmountInput('');
  }, [
    amountModal,
    dispatch,
    lastLoggedEntry,
    logAmount,
    summary.goalAmount,
    summary.totalAmount,
    validateAmountInput,
  ]);

  const openCustomAmount = useCallback(() => {
    setAmountError(undefined);
    setAmountInput('');
    setAmountModal({ mode: 'custom' });
    trackEventSafely('custom_amount_opened', { source: 'app' });
  }, []);

  const openEditEntry = useCallback((entry: HydrationEntry) => {
    setAmountError(undefined);
    setAmountInput(String(entry.amount));
    setAmountModal({ entry, mode: 'edit' });
  }, []);

  const closeAmountModal = useCallback(() => {
    setAmountModal(undefined);
  }, []);

  const refreshHome = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    setRefreshMessage(undefined);

    try {
      const result = await dispatch(refreshHomeHydration()).unwrap();

      if (result.healthSyncFailed) {
        setRefreshMessage('Health sync could not complete. Your local data is safe.');
      } else {
        setSuccessMessage('Refreshed.');
      }
    } catch {
      setRefreshMessage('Home could not refresh. Your local data is safe.');
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  const changeAmountInput = useCallback((value: string) => {
    setAmountInput(value.replace(/\D/g, ''));
    setAmountError(undefined);
  }, []);

  const undoRecentLog = useCallback(async () => {
    if (lastLoggedEntry === undefined) {
      return;
    }

    try {
      trackEventSafely('hydration_undo_action', { source: 'app' });
      await dispatch(removeHydrationEntry(lastLoggedEntry.id)).unwrap();
      setLastLoggedEntry(undefined);
      setSuccessMessage('Removed.');
    } catch {
      await playErrorHaptic();
    }
  }, [dispatch, lastLoggedEntry]);

  const confirmDeleteEntry = useCallback(
    (entry: HydrationEntry) => {
      Alert.alert('Delete this entry?', `${entry.amount} ml will be removed from today.`, [
        {
          style: 'cancel',
          text: 'Keep it',
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
    },
    [dispatch, lastLoggedEntry],
  );

  const parsedAmountInput = Number.parseInt(amountInput, 10);
  const guidanceMessage =
    parsedAmountInput > largeEntryAmount
      ? 'That looks high for one drink. Save it only if it is right.'
      : undefined;

  return {
    amountError,
    amountInput,
    amountModal,
    changeAmountInput,
    closeAmountModal,
    confirmDeleteEntry,
    errorMessage,
    guidanceMessage,
    isRefreshing,
    isSaving: status === 'saving',
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
  };
};
