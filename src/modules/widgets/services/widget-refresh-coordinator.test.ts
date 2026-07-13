import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { HydrationWidgetState } from '../types';

const mockBuildHydrationWidgetState = jest.fn<() => Promise<HydrationWidgetState>>();
const mockRefreshNativeWidgets = jest.fn<() => Promise<void>>();
const mockWriteNativeWidgetState = jest.fn<(stateJson: string) => Promise<void>>();

jest.mock('./widget-state-builder', () => ({
  buildHydrationWidgetState: mockBuildHydrationWidgetState,
}));

jest.mock('@platform/widgets', () => ({
  refreshNativeWidgets: mockRefreshNativeWidgets,
  writeNativeWidgetState: mockWriteNativeWidgetState,
}));

const { refreshHydrationWidgets } =
  require('./widget-refresh-coordinator') as typeof import('./widget-refresh-coordinator');

const createWidgetState = (consumedMl: number): HydrationWidgetState => ({
  actionNonce: `nonce-${consumedMl}`,
  completionPercentage: consumedMl,
  consumedMl,
  currentStreak: 1,
  goalCompleted: consumedMl >= 2000,
  goalMl: 2000,
  measurementUnit: 'ml',
  nextReminderAt: null,
  onboardingCompleted: true,
  remainingMl: Math.max(2000 - consumedMl, 0),
  themePreference: 'system',
  updatedAt: consumedMl,
});

describe('widget refresh coordinator', () => {
  beforeEach(() => {
    mockBuildHydrationWidgetState.mockReset();
    mockRefreshNativeWidgets.mockReset();
    mockWriteNativeWidgetState.mockReset();
  });

  it('writes the rebuilt snapshot before requesting a native widget refresh', async () => {
    const callOrder: string[] = [];
    mockBuildHydrationWidgetState.mockImplementation(async () => {
      callOrder.push('build');
      return createWidgetState(250);
    });
    mockWriteNativeWidgetState.mockImplementation(async () => {
      callOrder.push('write');
    });
    mockRefreshNativeWidgets.mockImplementation(async () => {
      callOrder.push('refresh');
    });

    await refreshHydrationWidgets('hydration_changed');

    expect(callOrder).toEqual(['build', 'write', 'refresh']);
    expect(mockWriteNativeWidgetState).toHaveBeenCalledWith(JSON.stringify(createWidgetState(250)));
  });

  it('queues rapid refresh requests so each mutation gets a fresh snapshot', async () => {
    const callOrder: string[] = [];
    mockBuildHydrationWidgetState
      .mockImplementationOnce(async () => {
        callOrder.push('build-250');
        return createWidgetState(250);
      })
      .mockImplementationOnce(async () => {
        callOrder.push('build-500');
        return createWidgetState(500);
      });
    mockWriteNativeWidgetState.mockImplementation(async (stateJson) => {
      const state = JSON.parse(stateJson) as HydrationWidgetState;
      callOrder.push(`write-${state.consumedMl}`);
    });
    mockRefreshNativeWidgets.mockImplementation(async () => {
      callOrder.push('refresh');
    });

    await Promise.all([
      refreshHydrationWidgets('hydration_changed'),
      refreshHydrationWidgets('hydration_changed'),
    ]);

    expect(callOrder).toEqual([
      'build-250',
      'write-250',
      'refresh',
      'build-500',
      'write-500',
      'refresh',
    ]);
  });

  it('does not request a native refresh when the snapshot write fails', async () => {
    mockBuildHydrationWidgetState.mockResolvedValue(createWidgetState(250));
    mockWriteNativeWidgetState.mockRejectedValue(new Error('write failed'));

    await expect(refreshHydrationWidgets('hydration_changed')).resolves.toBeUndefined();

    expect(mockRefreshNativeWidgets).not.toHaveBeenCalled();
  });
});
