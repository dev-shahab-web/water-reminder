import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { playDeleteConfirmationHaptic, playErrorHaptic } from '@platform/haptics';
import { useAppDispatch } from '@state/store/hooks';

import {
  getHydrationEntriesForDate,
  hasAnyHydrationEntries,
} from '../../repository/hydration-repository';
import { editHydrationEntry, removeHydrationEntry } from '../../state/hydration-slice';
import type { HydrationEntry } from '../../types';
import {
  addLocalDays,
  getDateFromLocalDateKey,
  getLocalDateKey,
  isFutureDay,
} from '../../utils/date';
import { calculateHydrationSummary } from '../../utils/summary';

const maxSingleEntryAmount = 5000;
const largeEntryAmount = 1500;

type HistoryStatus = 'error' | 'loading' | 'ready';

type EditState = {
  entry: HydrationEntry;
  value: string;
};

export const useHydrationHistory = (goalAmount: number, initialDateKey?: string) => {
  const dispatch = useAppDispatch();
  const [selectedDate, setSelectedDate] = useState(() =>
    getDateFromLocalDateKey(initialDateKey ?? getLocalDateKey()),
  );
  const [entries, setEntries] = useState<HydrationEntry[]>([]);
  const [hasAnyEntries, setHasAnyEntries] = useState(false);
  const [status, setStatus] = useState<HistoryStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [editState, setEditState] = useState<EditState | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [refreshSequence, setRefreshSequence] = useState(0);

  const selectedDateKey = getLocalDateKey(selectedDate);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [nextEntries, anyEntries] = await Promise.all([
        getHydrationEntriesForDate(selectedDate),
        hasAnyHydrationEntries(),
      ]);

      if (isMounted) {
        setEntries(nextEntries);
        setHasAnyEntries(anyEntries);
        setErrorMessage(undefined);
        setStatus('ready');
      }
    };

    load().catch(() => {
      if (isMounted) {
        setStatus('error');
        setErrorMessage("We couldn't load this day.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refreshSequence, selectedDate]);

  const loadSelectedDate = useCallback(() => {
    setStatus('loading');
    setErrorMessage(undefined);
    setRefreshSequence((currentValue) => currentValue + 1);
  }, []);

  const summary = useMemo(
    () => calculateHydrationSummary(entries, goalAmount),
    [entries, goalAmount],
  );

  const goToPreviousDay = useCallback(() => {
    setStatus('loading');
    setSelectedDate((currentDate) => addLocalDays(currentDate, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setStatus('loading');
    setSelectedDate((currentDate) => {
      const nextDate = addLocalDays(currentDate, 1);

      return isFutureDay(nextDate) ? currentDate : nextDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setStatus('loading');
    setSelectedDate(new Date());
  }, []);

  const openEditEntry = useCallback((entry: HydrationEntry) => {
    setAmountError(undefined);
    setEditState({
      entry,
      value: String(entry.amount),
    });
  }, []);

  const closeEditEntry = useCallback(() => {
    setEditState(undefined);
  }, []);

  const changeEditAmount = useCallback((value: string) => {
    setEditState((currentState) =>
      currentState === undefined
        ? currentState
        : {
            ...currentState,
            value: value.replace(/\D/g, ''),
          },
    );
    setAmountError(undefined);
  }, []);

  const validateEditAmount = useCallback((): number | undefined => {
    const parsedAmount = Number.parseInt(editState?.value ?? '', 10);

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
  }, [editState?.value]);

  const saveEditEntry = useCallback(async () => {
    if (editState === undefined) {
      return;
    }

    const amount = validateEditAmount();

    if (amount === undefined) {
      return;
    }

    try {
      await dispatch(editHydrationEntry({ amount, id: editState.entry.id })).unwrap();
      setEditState(undefined);
      loadSelectedDate();
    } catch {
      setAmountError("We couldn't save that. Please try again.");
      await playErrorHaptic();
    }
  }, [dispatch, editState, loadSelectedDate, validateEditAmount]);

  const confirmDeleteEntry = useCallback(
    (entry: HydrationEntry) => {
      Alert.alert('Delete this entry?', `${entry.amount} ml will be removed from this day.`, [
        {
          style: 'cancel',
          text: 'Keep it',
        },
        {
          onPress: async () => {
            try {
              await dispatch(removeHydrationEntry(entry.id)).unwrap();
              await playDeleteConfirmationHaptic();
              loadSelectedDate();
            } catch {
              setErrorMessage("We couldn't delete that entry. Please try again.");
              await playErrorHaptic();
            }
          },
          style: 'destructive',
          text: 'Delete',
        },
      ]);
    },
    [dispatch, loadSelectedDate],
  );

  const guidanceMessage =
    Number.parseInt(editState?.value ?? '', 10) > largeEntryAmount
      ? 'That looks high for one drink. Save it only if it is right.'
      : undefined;

  return {
    amountError,
    changeEditAmount,
    closeEditEntry,
    confirmDeleteEntry,
    editAmountValue: editState?.value ?? '',
    editModalVisible: editState !== undefined,
    entries,
    errorMessage,
    guidanceMessage,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    hasAnyEntries,
    isFutureNextDay: isFutureDay(addLocalDays(selectedDate, 1)),
    loadSelectedDate,
    openEditEntry,
    saveEditEntry,
    selectedDate,
    selectedDateKey,
    status,
    summary,
  };
};
