import type { HydrationEntry } from '../types';

export const shouldApplyHydrationRead = (
  activeReadRequestId: string | undefined,
  completedRequestId: string,
): boolean => activeReadRequestId === completedRequestId;

export const reconcileLoggedEntry = (
  entries: readonly HydrationEntry[],
  loggedEntry: HydrationEntry,
): { entries: HydrationEntry[]; previousTotal: number } => {
  const existingEntry = entries.find((entry) => entry.id === loggedEntry.id);
  const previousTotal =
    entries.reduce((total, entry) => total + entry.amount, 0) - (existingEntry?.amount ?? 0);
  const nextEntries = [loggedEntry, ...entries.filter((entry) => entry.id !== loggedEntry.id)];
  nextEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { entries: nextEntries, previousTotal };
};
