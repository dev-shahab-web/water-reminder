import type { ReminderPreferences, ReminderScheduleInput, ReminderScheduleItem } from '../types';
import { buildReminderNotificationContent } from '../services/reminder-notification-factory';
import type { ReminderCopyKey } from './reminder-copy';
import { addMinutes, getEndOfLocalDay, setLocalTime } from './time';

const maxScheduledReminders = 12;

const reminderCopyKeys = [
  'time_for_sip',
  'stay_refreshed',
  'nice_rhythm_today',
  'small_sip_keep_habit',
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

const getReminderCopyKey = (progress: number, index: number): ReminderCopyKey => {
  if (progress >= 0.8) {
    return index % 2 === 0 ? 'almost_there' : 'stay_refreshed';
  }

  if (progress >= 0.4) {
    return index % 2 === 0 ? 'nice_rhythm_today' : 'stay_refreshed';
  }

  return reminderCopyKeys[index % reminderCopyKeys.length];
};

const getReminderOccurrenceId = (date: Date, index: number): string => {
  return `hydration-reminder-${date.getTime()}-${index}`;
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
    const occurrenceId = getReminderOccurrenceId(nextDate, reminders.length);
    const notificationContent = buildReminderNotificationContent({
      copyKey: getReminderCopyKey(progress, reminders.length),
      mode: preferences.mode,
      occurrenceId,
      snoozeEnabled: preferences.snoozeEnabled,
      sound: preferences.sound,
      source: 'scheduled',
      vibrationEnabled: preferences.vibrationEnabled,
    });

    reminders.push({
      ...notificationContent,
      date: nextDate,
      identifier: occurrenceId,
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
    preferences.mode,
    preferences.vibrationEnabled,
    preferences.snoozeEnabled,
    preferences.defaultSnoozeMinutes,
    preferences.sound.type,
    preferences.pausedUntilIso ?? 'none',
    preferences.timezone,
    progressBucket,
    goalAmount,
  ].join('|');
};
