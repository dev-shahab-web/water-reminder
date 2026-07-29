import type { ReminderPreferences, ReminderScheduleInput, ReminderScheduleItem } from '../types';
import { buildReminderNotificationContent } from '../services/reminder-notification-factory';
import type { ReminderCopyKey } from './reminder-copy';
import {
  addLocalDays,
  addMinutes,
  getEndOfLocalDay,
  getStartOfLocalDay,
  setLocalTime,
} from './time';

export const reminderScheduleHorizonDays = 7;
const maxScheduledReminders = 64;

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
  if (!preferences.enabled) {
    return [];
  }

  const reminders: ReminderScheduleItem[] = [];
  const todayStart = getStartOfLocalDay(now);

  for (
    let dayOffset = 0;
    dayOffset < reminderScheduleHorizonDays && reminders.length < maxScheduledReminders;
    dayOffset += 1
  ) {
    const dayStart = addLocalDays(todayStart, dayOffset);
    const scheduleNow = dayOffset === 0 ? now : dayStart;
    const dayTotalAmount = dayOffset === 0 ? totalAmount : 0;

    reminders.push(
      ...calculateDailyReminderSchedule({
        goalAmount,
        maxCount: maxScheduledReminders - reminders.length,
        now: scheduleNow,
        occurrenceOffset: reminders.length,
        preferences,
        totalAmount: dayTotalAmount,
      }),
    );
  }

  return reminders;
};

const calculateDailyReminderSchedule = ({
  goalAmount,
  maxCount,
  now,
  occurrenceOffset,
  preferences,
  totalAmount,
}: ReminderScheduleInput & {
  maxCount: number;
  occurrenceOffset: number;
}): ReminderScheduleItem[] => {
  if (isPausedForWholeDay(preferences, now) || totalAmount >= goalAmount) {
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
  const pausedUntil = getPausedUntil(preferences);
  const eligibleNow =
    pausedUntil !== undefined && pausedUntil > now && pausedUntil < activeWindow.end
      ? pausedUntil
      : now;
  const firstCandidate =
    eligibleNow < activeWindow.start
      ? activeWindow.start
      : addMinutes(eligibleNow, intervalMinutes);
  const scheduleEnd = new Date(
    Math.min(activeWindow.end.getTime(), getEndOfLocalDay(firstCandidate).getTime()),
  );
  const reminders: ReminderScheduleItem[] = [];

  for (
    let nextDate = firstCandidate;
    nextDate <= scheduleEnd && reminders.length < maxCount;
    nextDate = addMinutes(nextDate, intervalMinutes)
  ) {
    const occurrenceId = getReminderOccurrenceId(nextDate, occurrenceOffset + reminders.length);
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

const getPausedUntil = (preferences: ReminderPreferences): Date | undefined => {
  if (preferences.pausedUntilIso === undefined) {
    return undefined;
  }

  const pausedUntil = new Date(preferences.pausedUntilIso);

  return Number.isNaN(pausedUntil.getTime()) ? undefined : pausedUntil;
};

const isPausedForWholeDay = (preferences: ReminderPreferences, day: Date): boolean => {
  const pausedUntil = getPausedUntil(preferences);

  return pausedUntil !== undefined && pausedUntil >= getEndOfLocalDay(day);
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
    reminderScheduleHorizonDays,
    progressBucket,
    goalAmount,
  ].join('|');
};
