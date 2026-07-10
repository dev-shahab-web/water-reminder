import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const safelyPlayHaptic = async (play: () => Promise<void>): Promise<void> => {
  try {
    await play();
  } catch {
    // Haptics are enhancement-only. Some emulators/dev builds do not expose every native method.
  }
};

export const playWaterLogHaptic = async (): Promise<void> => {
  await safelyPlayHaptic(async () => {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  });
};

export const playGoalCompleteHaptic = async (): Promise<void> => {
  await safelyPlayHaptic(async () => {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });
};

export const playErrorHaptic = async (): Promise<void> => {
  await safelyPlayHaptic(async () => {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  });
};

export const playDeleteConfirmationHaptic = async (): Promise<void> => {
  await safelyPlayHaptic(async () => {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  });
};
