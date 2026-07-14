import { useCallback, useEffect, useState } from 'react';

import { loadTodayHydration } from '@modules/hydration';
import { useAppDispatch } from '@state/store/hooks';

import {
  connectHealthConnect,
  disconnectHealthConnect,
  getHealthConnectState,
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
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    try {
      const result = await connectHealthConnect();
      if (result !== undefined) {
        setSyncResult(result);
        void dispatch(loadTodayHydration());
      }
      setState(await getHealthConnectState());
    } catch {
      setState(await getHealthConnectState());
    } finally {
      setIsBusy(false);
    }
  }, [dispatch, isBusy]);

  const syncNow = useCallback(async () => {
    if (isBusy) {
      return;
    }

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
  }, [dispatch, isBusy]);

  const disconnect = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    try {
      setState(await disconnectHealthConnect());
      setSyncResult(undefined);
    } catch {
      setState(await getHealthConnectState());
    } finally {
      setIsBusy(false);
    }
  }, [isBusy]);

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
