export type DayBounds = {
  endIso: string;
  startIso: string;
};

export const getLocalDayBounds = (date = new Date()): DayBounds => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    endIso: end.toISOString(),
    startIso: start.toISOString(),
  };
};

export const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getDateFromLocalDateKey = (dateKey: string): Date => {
  const [yearValue, monthValue, dayValue] = dateKey.split('-');
  const year = Number.parseInt(yearValue ?? '', 10);
  const month = Number.parseInt(monthValue ?? '', 10);
  const day = Number.parseInt(dayValue ?? '', 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

export const addLocalDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

export const isToday = (date: Date): boolean => {
  return getLocalDateKey(date) === getLocalDateKey();
};

export const isFutureDay = (date: Date): boolean => {
  const selectedDay = getDateFromLocalDateKey(getLocalDateKey(date));
  const today = getDateFromLocalDateKey(getLocalDateKey());

  return selectedDay.getTime() > today.getTime();
};

export const formatHistoryDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatEntryTime = (isoTimestamp: string): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTimestamp));
};

export const getGreeting = (date = new Date()): string => {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Fresh start.';
  }

  if (hour < 17) {
    return 'Keep the habit flowing.';
  }

  if (hour < 21) {
    return 'A calm finish.';
  }

  return 'Almost done for today.';
};
