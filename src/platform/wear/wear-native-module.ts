import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type WearStatus = { available: boolean; connectedWatches: number; watchName?: string };
type WearNative = {
  sync(configuration: string): Promise<void>;
  getStatus(): Promise<WearStatus>;
  requestSync(): Promise<void>;
  addListener(event: string): void;
  removeListeners(count: number): void;
};
const native: WearNative | undefined =
  Platform.OS === 'android' ? NativeModules.WaterReminderWear : undefined;

export const writeWearConfiguration = async (configuration: string): Promise<void> => {
  await native?.sync(configuration);
};
export const getWearStatus = async (): Promise<WearStatus> =>
  native?.getStatus() ?? { available: false, connectedWatches: 0 };
export const requestWearSync = async (): Promise<void> => {
  await native?.requestSync();
};
export const subscribeToWearHydration = (listener: () => void): (() => void) => {
  if (!native) return () => undefined;
  const subscription = new NativeEventEmitter(native).addListener('wearHydrationChanged', listener);
  return () => subscription.remove();
};
