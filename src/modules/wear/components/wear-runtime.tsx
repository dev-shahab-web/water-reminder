import { useEffect } from 'react';
import { loadTodayHydration } from '@modules/hydration/state/hydration-slice';
import { subscribeToSettings } from '@modules/settings/storage/settings-storage';
import { subscribeToWearHydration } from '@platform/wear/wear-native-module';
import { useAppDispatch, useAppSelector } from '@state/store/hooks';
import { syncWearConfiguration } from '../services/wear-sync-service';

export function WearRuntime() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.premium.preferences.theme);
  const access = useAppSelector((state) => state.premium.access);
  useEffect(() => {
    const sync = () => {
      void syncWearConfiguration().catch(() => undefined);
    };
    sync();
    return subscribeToSettings(sync);
  }, [theme, access]);
  useEffect(
    () =>
      subscribeToWearHydration(() => {
        void dispatch(loadTodayHydration());
      }),
    [dispatch],
  );
  return null;
}
