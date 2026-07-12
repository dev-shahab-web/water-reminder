import { useCallback, useEffect, useState } from 'react';

import { loadTodayHydration } from '@modules/hydration';
import { useAppDispatch } from '@state/store/hooks';

import {
  disconnectHealthConnect,
  getHealthConnectState,
  requestHealthConnectPermissions,
  syncHealthConnect,
} from '../services/health-connect-sync-service';
import type { HealthConnectState, HealthConnectSyncResult } from '../types';

const initialState: HealthConnectState = {
  availability: 'unsupported',
  lastSyncStatus: 'idle',
  permissionState: {
    canRequest: false,
    granted: false,
    readGranted: false,
    writeGranted: false,
  },
};

export const useHealthConnect = () => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<HealthConnectState>(initialState);
  const [syncResult, setSyncResult] = useState<HealthConnectSyncResult | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(async () => {
    setState(await getHealthConnectState());
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadState = async () => {
      const nextState = await getHealthConnectState();

      if (isMounted) {
        setState(nextState);
      }
    };

    void loadState();

    return () => {
      isMounted = false;
    };
  }, []);

  const connect = useCallback(async () => {
    setIsBusy(true);
    try {
      const nextState = await requestHealthConnectPermissions();
      setState(nextState);

      if (nextState.permissionState.granted) {
        const result = await syncHealthConnect();
        setSyncResult(result);
        setState(await getHealthConnectState());
        void dispatch(loadTodayHydration());
      }
    } catch {
      setState(await getHealthConnectState());
    } finally {
      setIsBusy(false);
    }
  }, [dispatch]);

  const syncNow = useCallback(async () => {
    setIsBusy(true);
    try {
      const result = await syncHealthConnect();
      setSyncResult(result);
      setState(await getHealthConnectState());
      void dispatch(loadTodayHydration());
    } catch {
      setState(await getHealthConnectState());
    } finally {
      setIsBusy(false);
    }
  }, [dispatch]);

  const disconnect = useCallback(async () => {
    setIsBusy(true);
    try {
      setState(await disconnectHealthConnect());
      setSyncResult(undefined);
    } catch {
      setState(await getHealthConnectState());
    } finally {
      setIsBusy(false);
    }
  }, []);

  return {
    connect,
    disconnect,
    isBusy,
    refresh,
    state,
    syncNow,
    syncResult,
  };
};
