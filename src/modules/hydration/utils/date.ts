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
