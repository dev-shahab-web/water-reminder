import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AppUpdate, EngagementPreferences } from '../types';
import {
  checkForAppUpdate,
  getEngagementSnapshot,
  initializeEngagement,
  openStoreReview,
  performAppUpdate,
  respondToReview,
  shouldPromptForUpdate,
  snoozeUpdatePrompt,
} from './engagement-service';

const mockValues = new Map<string, number>();
const mockPreferences: EngagementPreferences = {
  firstInstallTime: 1_700_000_000_000,
  reviewRemindersEnabled: true,
  updateNotificationsEnabled: true,
  reviewStatus: 'not-confirmed',
};
const mockConfigure = jest.fn(async () => mockPreferences);
const mockCheck = jest.fn<() => Promise<AppUpdate>>();
const mockStart = jest.fn<() => Promise<string>>();
const mockComplete = jest.fn(async () => undefined);
const mockOpen = jest.fn(async () => undefined);
const mockResponse = jest.fn(async (_value: string) => mockPreferences);

jest.mock('react-native', () => {
  const native = jest.requireActual<typeof import('react-native')>('react-native');
  Object.defineProperty(native.Platform, 'OS', { get: () => 'android' });
  native.NativeModules.WaterReminderEngagement = {
    configure: (...args: []) => mockConfigure(...args),
    checkUpdate: () => mockCheck(),
    startUpdate: () => mockStart(),
    completeUpdate: () => mockComplete(),
    openStore: () => mockOpen(),
    setReviewResponse: (value: string) => mockResponse(value),
  };
  return native;
});
jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getNumber: (key: string) => mockValues.get(key),
    set: (key: string, value: number) => mockValues.set(key, value),
  }),
}));
jest.mock('@modules/onboarding/repository/onboarding-storage', () => ({
  getOnboardingState: () => ({ onboardingCompleted: true }),
}));

const available: AppUpdate = {
  state: 'available',
  versionCode: 9,
  downloadedBytes: 0,
  totalBytes: 0,
};
beforeEach(async () => {
  jest.clearAllMocks();
  mockValues.clear();
  mockCheck.mockResolvedValue(available);
  mockStart.mockResolvedValue('accepted');
  await initializeEngagement();
  await checkForAppUpdate();
  jest.clearAllMocks();
});

describe('Play reviews and app updates', () => {
  it('does not equate opening Google Play with submitting a review', async () => {
    await openStoreReview();
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockResponse).toHaveBeenCalledWith('opened');
    expect(mockResponse).not.toHaveBeenCalledWith('reviewed');
    expect(getEngagementSnapshot().preferences?.reviewStatus).toBe('not-confirmed');
  });
  it('records a completed review only after the user confirms it', async () => {
    await respondToReview('reviewed');
    expect(mockResponse).toHaveBeenCalledWith('reviewed');
  });
  it('does not dismiss reminders when opening the store fails', async () => {
    mockOpen.mockRejectedValueOnce(new Error('no handler'));
    await expect(openStoreReview()).rejects.toThrow();
    expect(mockResponse).not.toHaveBeenCalled();
  });
  it('deduplicates concurrent update checks', async () => {
    const a = checkForAppUpdate();
    const b = checkForAppUpdate();
    await Promise.all([a, b]);
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });
  it('reports an unavailable check instead of claiming the app is current', async () => {
    mockCheck.mockRejectedValueOnce(new Error('not owned by Play'));
    expect((await checkForAppUpdate()).state).toBe('unavailable');
    expect(shouldPromptForUpdate(getEngagementSnapshot().update)).toBe(false);
  });
  it('snoozes the same update but lets a newer release or downloaded stage prompt', () => {
    expect(shouldPromptForUpdate(available)).toBe(true);
    snoozeUpdatePrompt(available);
    expect(shouldPromptForUpdate(available)).toBe(false);
    expect(shouldPromptForUpdate({ ...available, versionCode: 10 })).toBe(true);
    expect(shouldPromptForUpdate({ ...available, state: 'downloaded' })).toBe(true);
    expect(shouldPromptForUpdate(available, Date.now() + 25 * 3_600_000)).toBe(true);
  });
  it('starts a download only after explicit action, then rechecks status', async () => {
    expect(mockStart).not.toHaveBeenCalled();
    await performAppUpdate();
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockComplete).not.toHaveBeenCalled();
  });
  it('completes a downloaded update only when the user requests restart', async () => {
    mockCheck.mockResolvedValue({ ...available, state: 'downloaded' });
    await checkForAppUpdate();
    expect(mockComplete).not.toHaveBeenCalled();
    await performAppUpdate();
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockStart).not.toHaveBeenCalled();
  });
  it('falls back to the Play listing when in-app updates are not allowed', async () => {
    mockStart.mockResolvedValue('store');
    await performAppUpdate();
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });
  it('returns quietly when the user declines Play consent', async () => {
    mockStart.mockResolvedValue('cancelled');
    await expect(performAppUpdate()).resolves.toBeUndefined();
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
