import { addLocalDays, getDateFromLocalDateKey, getLocalDateKey } from '../../hydration/utils/date';

export const getLastSevenDays = (today = new Date()): Date[] => {
  const startDate = addLocalDays(today, -6);

  return Array.from({ length: 7 }, (_, index) => addLocalDays(startDate, index));
};

export const getPreviousSevenDays = (today = new Date()): Date[] => {
  const startDate = addLocalDays(today, -13);

  return Array.from({ length: 7 }, (_, index) => addLocalDays(startDate, index));
};

export const getMonthDates = (date = new Date()): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
};

export const getDateKeyRange = (dates: readonly Date[]): { endDate: Date; startDate: Date } => {
  const firstDate = dates[0] ?? new Date();
  const lastDate = dates[dates.length - 1] ?? firstDate;

  return {
    endDate: lastDate,
    startDate: firstDate,
  };
};

export const getPreviousDateKey = (dateKey: string): string => {
  return getLocalDateKey(addLocalDays(getDateFromLocalDateKey(dateKey), -1));
};
