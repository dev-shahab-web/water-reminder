import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockLoadTodayHydration = jest.fn();
const mockRefreshHydrationWidgets = jest.fn<() => Promise<void>>();
const mockResetDatabaseConnection = jest.fn<() => Promise<void>>();

jest.mock('@modules/hydration', () => ({
  loadTodayHydration: mockLoadTodayHydration,
}));

jest.mock('@platform/database', () => ({
  resetDatabaseConnection: mockResetDatabaseConnection,
}));

jest.mock('./widget-refresh-coordinator', () => ({
  refreshHydrationWidgets: mockRefreshHydrationWidgets,
}));

const { syncWidgetLiveState } =
  require('./widget-live-sync-service') as typeof import('./widget-live-sync-service');

describe('widget live sync service', () => {
  beforeEach(() => {
    mockLoadTodayHydration.mockReset();
    mockRefreshHydrationWidgets.mockReset();
    mockResetDatabaseConnection.mockReset();
    mockLoadTodayHydration.mockReturnValue({ type: 'hydration/loadToday' });
    mockRefreshHydrationWidgets.mockResolvedValue();
    mockResetDatabaseConnection.mockResolvedValue();
  });

  it('reopens SQLite and reloads Redux hydration state before refreshing widgets on app active', async () => {
    const dispatch = jest.fn(() => ({
      unwrap: jest.fn<() => Promise<void>>().mockResolvedValue(),
    }));
    const callOrder: string[] = [];

    dispatch.mockImplementation(() => {
      callOrder.push('load');

      return {
        unwrap: jest.fn<() => Promise<void>>().mockResolvedValue(),
      };
    });
    mockResetDatabaseConnection.mockImplementation(async () => {
      callOrder.push('reset');
    });
    mockRefreshHydrationWidgets.mockImplementation(async () => {
      callOrder.push('refresh');
    });

    await syncWidgetLiveState({
      dispatch: dispatch as never,
      reason: 'app_active',
    });

    expect(dispatch).toHaveBeenCalledWith({ type: 'hydration/loadToday' });
    expect(mockRefreshHydrationWidgets).toHaveBeenCalledWith('app_active');
    expect(callOrder).toEqual(['reset', 'load', 'refresh']);
  });

  it('uses the widget event refresh reason after native widget actions', async () => {
    const dispatch = jest.fn(() => ({
      unwrap: jest.fn<() => Promise<void>>().mockResolvedValue(),
    }));

    await syncWidgetLiveState({
      dispatch: dispatch as never,
      reason: 'native_widget_event',
    });

    expect(mockRefreshHydrationWidgets).toHaveBeenCalledWith('widget_event');
  });
});
