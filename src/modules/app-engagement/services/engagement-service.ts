import { Linking, NativeModules, Platform } from 'react-native';
import { engagementConfig } from '@core/config/engagement-config';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';
import { getStorage } from '@platform/storage';
import type { AppUpdate, EngagementPreferences } from '../types';

type EngagementNative = {
  configure(json: string, onboarded: boolean): Promise<EngagementPreferences>;
  setPreferences(review: boolean, updates: boolean): Promise<EngagementPreferences>;
  setReviewResponse(response: string): Promise<EngagementPreferences>;
  checkUpdate(): Promise<AppUpdate>;
  startUpdate(): Promise<
    'accepted' | 'cancelled' | 'failed' | 'store' | 'downloaded' | 'in-progress'
  >;
  completeUpdate(): Promise<void>;
  openStore(): Promise<void>;
};
const native: EngagementNative | undefined =
  Platform.OS === 'android' ? NativeModules.WaterReminderEngagement : undefined;
const unavailable: AppUpdate = {
  state: 'unavailable',
  versionCode: 0,
  downloadedBytes: 0,
  totalBytes: 0,
};
type Snapshot = {
  preferences?: EngagementPreferences;
  update: AppUpdate;
  checking: boolean;
  busy: boolean;
  nativeAvailable: boolean;
};
let snapshot: Snapshot = {
  update: unavailable,
  checking: false,
  busy: false,
  nativeAvailable: Boolean(native),
};
const listeners = new Set<() => void>();
export const getEngagementSnapshot = () => snapshot;
export const subscribeEngagement = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const publish = (patch: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
};

export const initializeEngagement = async () => {
  if (!native) return;
  const preferences = await native.configure(
    JSON.stringify(engagementConfig),
    getOnboardingState().onboardingCompleted,
  );
  publish({ preferences });
};

let checking: Promise<AppUpdate> | undefined;
export const checkForAppUpdate = (): Promise<AppUpdate> => {
  if (checking) return checking;
  publish({ checking: true });
  checking = (async () => {
    try {
      const update = native ? await native.checkUpdate() : unavailable;
      publish({ update });
      return update;
    } catch {
      // A Play/network failure is not proof that this installation is current.
      publish({ update: unavailable });
      return unavailable;
    } finally {
      publish({ checking: false });
    }
  })().finally(() => {
    checking = undefined;
  });
  return checking;
};

export const changeEngagementPreferences = async (
  changes: Partial<
    Pick<EngagementPreferences, 'reviewRemindersEnabled' | 'updateNotificationsEnabled'>
  >,
) => {
  if (!native) throw new Error('These controls require the Android app.');
  if (!snapshot.preferences) await initializeEngagement();
  const preferences = { ...snapshot.preferences!, ...changes };
  publish({
    preferences: await native.setPreferences(
      preferences.reviewRemindersEnabled,
      preferences.updateNotificationsEnabled,
    ),
  });
};

export const respondToReview = async (response: 'reviewed' | 'never' | 'later' | 'opened') => {
  if (native) publish({ preferences: await native.setReviewResponse(response) });
};

export const openPlayStore = async () => {
  if (native) {
    await native.openStore();
    return;
  }
  const url = `https://play.google.com/store/apps/details?id=${engagementConfig.playPackage}`;
  await Linking.openURL(url);
};

export const openStoreReview = async () => {
  await openPlayStore();
  // Opening Play is not evidence that a review was submitted; only snooze.
  await respondToReview('opened');
};

export const updatePromptKey = (update: AppUpdate) =>
  `${update.versionCode}:${update.state === 'downloaded' ? 'downloaded' : 'available'}`;
export const shouldPromptForUpdate = (update: AppUpdate, now = Date.now()) =>
  ['available', 'downloaded', 'resume'].includes(update.state) &&
  update.versionCode > 0 &&
  now >= (getStorage().getNumber(`updatePromptUntil:${updatePromptKey(update)}`) ?? 0);

export const snoozeUpdatePrompt = (update: AppUpdate) => {
  getStorage().set(
    `updatePromptUntil:${updatePromptKey(update)}`,
    Date.now() + engagementConfig.updates.promptSnoozeHours * 3_600_000,
  );
  publish({});
};

export const performAppUpdate = async () => {
  if (snapshot.busy) return;
  publish({ busy: true });
  try {
    if (!native) {
      await openPlayStore();
      return;
    }
    if (snapshot.update.state === 'downloaded') await native.completeUpdate();
    else {
      const result = await native.startUpdate();
      if (result === 'failed') throw new Error('The update did not start. Please try again.');
      if (result === 'store') await openPlayStore();
    }
    await checkForAppUpdate();
  } finally {
    publish({ busy: false });
  }
};
