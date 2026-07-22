import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { ReminderCard } from '@modules/reminders';
import { AppScreen, IconButton, SecondaryButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { useSettings } from '../hooks/use-settings';

export function ReminderSettingsScreen() {
  const theme = useTheme<AppTheme>();
  const { isBusy, reminders, sendTestNotification } = useSettings();

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => {
            router.back();
          }}
          style={styles.headerButton}
        />
        <View style={styles.headerCopy}>
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              {
                color: theme.app.colors.textPrimary,
                fontFamily: theme.app.typography.fontFamily.display,
                fontSize: theme.app.typography.fontSize.title,
                lineHeight: theme.app.typography.lineHeight.title,
              },
            ]}
          >
            Reminder Settings
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            Tune reminders without making hydration feel noisy.
          </Text>
        </View>
      </View>

      <ReminderCard
        defaultSnoozeMinutes={reminders.preferences.defaultSnoozeMinutes}
        enabled={reminders.preferences.enabled}
        intervalMinutes={reminders.preferences.intervalMinutes}
        mode={reminders.preferences.mode}
        onDefaultSnoozeChange={reminders.updateDefaultSnooze}
        onIntervalChange={reminders.updateInterval}
        onModeChange={reminders.updateMode}
        onPause={(option) => {
          void reminders.pause(option);
        }}
        onResume={reminders.resume}
        onNotificationSoundPress={() => {
          void reminders.openNotificationSoundSettings();
        }}
        onSleepTimeChange={reminders.updateSleepTime}
        onSnoozeEnabledChange={reminders.updateSnoozeEnabled}
        onToggleEnabled={() => {
          void reminders.toggleEnabled();
        }}
        onVibrationChange={reminders.updateVibration}
        onWakeTimeChange={reminders.updateWakeTime}
        permissionMessage={reminders.permissionMessage}
        preview={reminders.preview}
        sleepTime={reminders.preferences.sleepTime}
        snoozeEnabled={reminders.preferences.snoozeEnabled}
        status={reminders.status}
        summary={reminders.summary}
        vibrationEnabled={reminders.preferences.vibrationEnabled}
        wakeTime={reminders.preferences.wakeTime}
      />

      <SecondaryButton
        accessibilityLabel="Send a test notification"
        disabled={isBusy}
        icon="bell-ring"
        label="Test notification"
        onPress={() => {
          void sendTestNotification();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 640,
    width: '100%',
  },
  subtitle: {},
  title: {
    fontWeight: '800',
  },
});
