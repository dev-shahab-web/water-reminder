import type { HydrationEntry, HydrationSummary } from '../types';

export const calculateHydrationSummary = (
  entries: readonly HydrationEntry[],
  goalAmount: number,
): HydrationSummary => {
  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = Math.max(goalAmount - totalAmount, 0);
  const percent = goalAmount <= 0 ? 0 : totalAmount / goalAmount;

  return {
    entries: [...entries],
    goalAmount,
    percent,
    remainingAmount,
    totalAmount,
  };
};

export const getSuccessMicrocopy = ({
  entryCount,
  goalReached,
}: {
  entryCount: number;
  goalReached: boolean;
}): string => {
  if (goalReached) {
    return "Nice work. You've finished today's hydration.";
  }

  if (entryCount === 1) {
    return 'First glass logged.';
  }

  return 'Refreshing.';
};
