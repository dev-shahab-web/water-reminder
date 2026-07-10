export const getCurrentTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'local';
};

export const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getEndOfLocalDay = (date = new Date()): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const parseLocalTime = (time: string): { hour: number; minute: number } => {
  const [hourValue, minuteValue] = time.split(':');
  const hour = Number.parseInt(hourValue ?? '', 10);
  const minute = Number.parseInt(minuteValue ?? '', 10);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 9, minute: 0 };
  }

  return { hour, minute };
};

export const setLocalTime = (date: Date, time: string): Date => {
  const nextDate = new Date(date);
  const { hour, minute } = parseLocalTime(time);
  nextDate.setHours(hour, minute, 0, 0);

  return nextDate;
};

export const formatReminderTime = (time: string): string => {
  const date = setLocalTime(new Date(), time);

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
