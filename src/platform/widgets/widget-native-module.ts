import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type WaterReminderWidgetNativeModule = {
  addListener: (eventName: string) => void;
  refreshWidgets: () => Promise<void>;
  removeListeners: (count: number) => void;
  writeWidgetState: (stateJson: string) => Promise<void>;
};

const nativeModule =
  Platform.OS === 'android'
    ? (NativeModules.WaterReminderWidget as WaterReminderWidgetNativeModule | undefined)
    : undefined;

export const writeNativeWidgetState = async (stateJson: string): Promise<void> => {
  await nativeModule?.writeWidgetState(stateJson);
};

export const refreshNativeWidgets = async (): Promise<void> => {
  await nativeModule?.refreshWidgets();
};

export const subscribeToNativeWidgetHydrationChanges = (listener: () => void): (() => void) => {
  if (nativeModule === undefined) {
    return () => {};
  }

  const eventEmitter = new NativeEventEmitter(nativeModule);
  const subscription = eventEmitter.addListener('widgetHydrationChanged', listener);

  return () => {
    subscription.remove();
  };
};
