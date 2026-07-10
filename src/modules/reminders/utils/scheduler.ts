import type { ReminderPreferences, ReminderScheduleInput, ReminderScheduleItem } from '../types';
import { addMinutes, getEndOfLocalDay, setLocalTime } from './time';

const maxScheduledReminders = 12;

const reminderCopies = [
  'Time for a sip.',
  'Stay refreshed.',
  'Nice rhythm today.',
  'A small sip can keep the habit going.',
] as const;

export const getSmartIntervalMinutes = ({
  intervalMinutes,
  progress,
}: {
  intervalMinutes: number;
  progress: number;
}): number => {
  if (progress >= 0.8) {
    return Math.round(intervalMinutes * 2.25);
  }

  if (progress >= 0.4) {
    return Math.round(intervalMinutes * 1.5);
  }

  return intervalMinutes;
};

const getReminderCopy = (progress: number, index: number): string => {
  if (progress >= 0.8) {
    return index % 2 === 0 ? 'Almost there.' : 'Stay refreshed.';
  }

  if (progress >= 0.4) {
    return index % 2 === 0 ? 'Nice rhythm today.' : 'Stay refreshed.';
  }

  return reminderCopies[index % reminderCopies.length];
};

const isPaused = (preferences: ReminderPreferences, now: Date): boolean => {
  return (
    preferences.pausedUntilIso !== undefined &&
    new Date(preferences.pausedUntilIso).getTime() > now.getTime()
  );
};

const getActiveWindow = (
  preferences: ReminderPreferences,
  now: Date,
): { end: Date; start: Date } => {
  let start = setLocalTime(now, preferences.wakeTime);
  let end = setLocalTime(now, preferences.sleepTime);

  if (end <= start) {
    if (now < end) {
      start = addMinutes(start, -24 * 60);
    } else {
      end = addMinutes(end, 24 * 60);
    }
  }

  if (now > end) {
    start = addMinutes(start, 24 * 60);
    end = addMinutes(end, 24 * 60);
  }

  return { end, start };
};

export const calculateReminderSchedule = ({
  goalAmount,
  now,
  preferences,
  totalAmount,
}: ReminderScheduleInput): ReminderScheduleItem[] => {
  if (!preferences.enabled || isPaused(preferences, now) || totalAmount >= goalAmount) {
    return [];
  }

  const progress = goalAmount <= 0 ? 1 : totalAmount / goalAmount;

  if (progress >= 1) {
    return [];
  }

  const intervalMinutes = getSmartIntervalMinutes({
    intervalMinutes: preferences.intervalMinutes,
    progress,
  });
  const activeWindow = getActiveWindow(preferences, now);
  const firstCandidate =
    now < activeWindow.start ? activeWindow.start : addMinutes(now, intervalMinutes);
  const scheduleEnd = new Date(
    Math.min(activeWindow.end.getTime(), getEndOfLocalDay(firstCandidate).getTime()),
  );
  const reminders: ReminderScheduleItem[] = [];

  for (
    let nextDate = firstCandidate;
    nextDate <= scheduleEnd && reminders.length < maxScheduledReminders;
    nextDate = addMinutes(nextDate, intervalMinutes)
  ) {
    reminders.push({
      body: getReminderCopy(progress, reminders.length),
      date: nextDate,
      title: 'Water Reminder',
    });
  }

  return reminders;
};

export const buildReminderScheduleSignature = ({
  goalAmount,
  preferences,
  totalAmount,
}: Omit<ReminderScheduleInput, 'now'>): string => {
  const progressBucket =
    totalAmount >= goalAmount ? 'complete' : Math.floor((totalAmount / goalAmount) * 10);

  return [
    preferences.enabled,
    preferences.wakeTime,
    preferences.sleepTime,
    preferences.intervalMinutes,
    preferences.pausedUntilIso ?? 'none',
    preferences.timezone,
    progressBucket,
    goalAmount,
  ].join('|');
};
