import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { appLightTheme } from '@shared/theme';

import { ReminderCard } from './reminder-card';

jest.mock('@shared/motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, View } = require('react-native') as typeof import('react-native');

  return {
    AnimatedCard: View,
    AnimatedPressableScale: Pressable,
  };
});

jest.mock('@shared/components', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactNative = require('react-native') as typeof import('react-native');
  const { Pressable, Text, View } = ReactNative;

  return {
    MaterialCommunityIcon: ({ testID }: { testID?: string }) => <View testID={testID} />,
    PrimaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    SecondaryButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    SectionHeader: ({ subtitle, title }: { subtitle?: string; title: string }) => (
      <View>
        <Text>{title}</Text>
        {subtitle === undefined ? null : <Text>{subtitle}</Text>}
      </View>
    ),
  };
});

const setPlatform = (os: typeof Platform.OS): void => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

const renderReminderCard = ({
  mode = 'gentle',
  onNotificationSoundPress = jest.fn(),
  onSnoozeEnabledChange = jest.fn(),
  onVibrationChange = jest.fn(),
}: {
  mode?: 'active' | 'gentle';
  onNotificationSoundPress?: () => void;
  onSnoozeEnabledChange?: (enabled: boolean) => void;
  onVibrationChange?: (enabled: boolean) => void;
} = {}) => {
  return render(
    <PaperProvider theme={appLightTheme}>
      <ReminderCard
        defaultSnoozeMinutes={10}
        enabled
        intervalMinutes={90}
        mode={mode}
        onDefaultSnoozeChange={jest.fn()}
        onIntervalChange={jest.fn()}
        onModeChange={jest.fn()}
        onNotificationSoundPress={onNotificationSoundPress}
        onPause={jest.fn()}
        onResume={jest.fn()}
        onSleepTimeChange={jest.fn()}
        onSnoozeEnabledChange={onSnoozeEnabledChange}
        onToggleEnabled={jest.fn()}
        onVibrationChange={onVibrationChange}
        onWakeTimeChange={jest.fn()}
        preview="Next reminder around 10:00 AM."
        sleepTime="22:00"
        snoozeEnabled
        status="active"
        summary="8:00 AM to 10:00 PM, every 90 min"
        vibrationEnabled
        wakeTime="08:00"
      />
    </PaperProvider>,
  );
};

describe('ReminderCard notification sound row', () => {
  beforeEach(() => {
    setPlatform('android');
  });

  it('renders Gentle mode sound as silent and read-only', () => {
    const onNotificationSoundPress = jest.fn();
    const screen = renderReminderCard({ mode: 'gentle', onNotificationSoundPress });

    expect(screen.getByText('Notification sound')).toBeTruthy();
    expect(screen.getByText('Silent')).toBeTruthy();
    expect(screen.getByText('Gentle reminders do not play a sound.')).toBeTruthy();
    expect(screen.queryByTestId('notification-sound-chevron')).toBeNull();
    expect(screen.queryByText('Device notification sound')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Notification sound. Silent' })).toBeNull();
    expect(onNotificationSoundPress).not.toHaveBeenCalled();
  });

  it('renders Active mode sound as system default with Android settings navigation', () => {
    const onNotificationSoundPress = jest.fn();
    const screen = renderReminderCard({ mode: 'active', onNotificationSoundPress });

    expect(screen.getByText('System default')).toBeTruthy();
    expect(screen.getByText('Change the tone in Android notification settings.')).toBeTruthy();
    expect(screen.getByTestId('notification-sound-chevron')).toBeTruthy();
    expect(screen.queryByText('Device notification sound')).toBeNull();

    fireEvent.press(screen.getByLabelText('Notification sound. System default'));

    expect(onNotificationSoundPress).toHaveBeenCalledTimes(1);
  });

  it('renders unsupported platforms as honest read-only settings', () => {
    const onNotificationSoundPress = jest.fn();
    setPlatform('ios');

    const screen = renderReminderCard({ mode: 'active', onNotificationSoundPress });

    expect(screen.getByText('System default')).toBeTruthy();
    expect(
      screen.getByText('Notification sound is managed by Android notification channels.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('notification-sound-chevron')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Notification sound. System default' })).toBeNull();
    expect(onNotificationSoundPress).not.toHaveBeenCalled();
  });
});

describe('ReminderCard preference switches', () => {
  beforeEach(() => {
    setPlatform('android');
  });

  it('calls the vibration handler exactly once for one switch transition', () => {
    const onVibrationChange = jest.fn();
    const screen = renderReminderCard({ onVibrationChange });

    fireEvent(screen.getByLabelText('Vibration'), 'valueChange', false);

    expect(onVibrationChange).toHaveBeenCalledTimes(1);
    expect(onVibrationChange).toHaveBeenCalledWith(false);
  });

  it('calls the snooze handler exactly once for one switch transition', () => {
    const onSnoozeEnabledChange = jest.fn();
    const screen = renderReminderCard({ onSnoozeEnabledChange });

    fireEvent(screen.getByLabelText('Enable snooze'), 'valueChange', false);

    expect(onSnoozeEnabledChange).toHaveBeenCalledTimes(1);
    expect(onSnoozeEnabledChange).toHaveBeenCalledWith(false);
  });
});
