export const HYDRATION_ENTRY_SOURCES = ['quick_add', 'custom', 'edit'] as const;

export type HydrationEntrySource = (typeof HYDRATION_ENTRY_SOURCES)[number];

export type HydrationEntry = {
  amount: number;
  createdAt: string;
  id: string;
  source: HydrationEntrySource;
  timestamp: string;
  updatedAt: string;
};

export type HydrationSummary = {
  entries: HydrationEntry[];
  goalAmount: number;
  percent: number;
  remainingAmount: number;
  totalAmount: number;
};
