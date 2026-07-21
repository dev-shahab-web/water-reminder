import { getStorage } from '@platform/storage';

const maxHandledOccurrenceIds = 60;

export const reminderActionStorageKeys = {
  handledOccurrenceIds: 'reminderHandledOccurrenceIds',
} as const;

const parseHandledOccurrenceIds = (value: string | undefined): string[] => {
  if (value === undefined) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

export const hasHandledReminderOccurrence = (occurrenceId: string): boolean => {
  return parseHandledOccurrenceIds(
    getStorage().getString(reminderActionStorageKeys.handledOccurrenceIds),
  ).includes(occurrenceId);
};

export const markReminderOccurrenceHandled = (occurrenceId: string): boolean => {
  const storage = getStorage();
  const handledOccurrenceIds = parseHandledOccurrenceIds(
    storage.getString(reminderActionStorageKeys.handledOccurrenceIds),
  );

  if (handledOccurrenceIds.includes(occurrenceId)) {
    return false;
  }

  storage.set(
    reminderActionStorageKeys.handledOccurrenceIds,
    JSON.stringify([...handledOccurrenceIds, occurrenceId].slice(-maxHandledOccurrenceIds)),
  );

  return true;
};
