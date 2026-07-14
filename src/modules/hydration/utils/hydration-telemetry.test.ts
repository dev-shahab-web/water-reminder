import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockTrackEventSafely = jest.fn();

jest.mock('@platform/telemetry', () => ({
  trackEventSafely: mockTrackEventSafely,
}));

const { trackHydrationLogSuccess } =
  require('./hydration-telemetry') as typeof import('./hydration-telemetry');

describe('hydration telemetry', () => {
  beforeEach(() => {
    mockTrackEventSafely.mockReset();
  });

  it('tracks quick add and custom logs after successful hydration actions', () => {
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 250,
      previousTotal: 0,
      source: 'quick_add',
    });
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 500,
      previousTotal: 250,
      source: 'custom',
    });

    expect(mockTrackEventSafely).toHaveBeenCalledWith('quick_add_used', { source: 'app' });
    expect(mockTrackEventSafely).toHaveBeenCalledWith('custom_amount_logged', {
      source: 'app',
    });
  });

  it('tracks goal completion only when progress crosses from below goal to complete', () => {
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 1999,
      previousTotal: 1500,
      source: 'quick_add',
    });
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 2000,
      previousTotal: 1999,
      source: 'quick_add',
    });
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 2250,
      previousTotal: 2000,
      source: 'quick_add',
    });

    expect(mockTrackEventSafely).toHaveBeenCalledTimes(4);
    expect(
      mockTrackEventSafely.mock.calls.filter(([eventName]) => eventName === 'goal_completed'),
    ).toEqual([['goal_completed', { source: 'app' }]]);
  });

  it('does not send hydration values as telemetry parameters', () => {
    trackHydrationLogSuccess({
      goalAmount: 2000,
      nextTotal: 2000,
      previousTotal: 1750,
      source: 'custom',
    });

    expect(mockTrackEventSafely).toHaveBeenCalledWith('custom_amount_logged', {
      source: 'app',
    });
    expect(mockTrackEventSafely).toHaveBeenCalledWith('goal_completed', {
      source: 'app',
    });
    expect(JSON.stringify(mockTrackEventSafely.mock.calls)).not.toContain('2000');
    expect(JSON.stringify(mockTrackEventSafely.mock.calls)).not.toContain('1750');
  });
});
