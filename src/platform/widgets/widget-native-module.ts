import { NativeModules, Platform } from 'react-native';

type WaterReminderWidgetNativeModule = {
  refreshWidgets: () => Promise<void>;
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
