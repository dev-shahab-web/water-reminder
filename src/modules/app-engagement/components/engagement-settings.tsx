import { useState, useSyncExternalStore } from 'react';
import { Alert, Linking, Switch } from 'react-native';
import { SettingsRow } from '@modules/settings/components/settings-row';
import { requestNotificationPermissions } from '@platform/notifications';
import { engagementConfig } from '@core/config/engagement-config';
import {
  changeEngagementPreferences,
  getEngagementSnapshot,
  subscribeEngagement,
} from '../services/engagement-service';

export function EngagementSettings() {
  const { preferences, nativeAvailable } = useSyncExternalStore(
    subscribeEngagement,
    getEngagementSnapshot,
    getEngagementSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const change = async (
    key: 'reviewRemindersEnabled' | 'updateNotificationsEnabled',
    enabled: boolean,
  ) => {
    setBusy(true);
    try {
      if (enabled && !(await requestNotificationPermissions()).granted) {
        Alert.alert(
          'Notifications are off',
          'Enable notifications in Android settings to receive these reminders.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Open settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }
      await changeEngagementPreferences({ [key]: enabled });
    } catch {
      Alert.alert('Could not save preference', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <SettingsRow
        icon="star-outline"
        label="Review reminders"
        supportingText={
          preferences?.reviewStatus === 'reviewed'
            ? 'Thanks for your review. We won’t ask again.'
            : `First reminder after ${engagementConfig.review.firstReminderDays} days, then every ${engagementConfig.review.repeatDays} days. Turn off anytime.`
        }
      >
        <Switch
          testID="review-reminders-switch"
          accessibilityLabel="Review reminders"
          disabled={!nativeAvailable || busy || !preferences}
          value={preferences?.reviewRemindersEnabled ?? false}
          onValueChange={(value) => {
            void change('reviewRemindersEnabled', value);
          }}
        />
      </SettingsRow>
      <SettingsRow
        icon="cellphone-arrow-down"
        label="Update notifications"
        supportingText="Know when Google Play has a newer version for your device."
      >
        <Switch
          testID="update-notifications-switch"
          accessibilityLabel="Update notifications"
          disabled={!nativeAvailable || busy || !preferences}
          value={preferences?.updateNotificationsEnabled ?? false}
          onValueChange={(value) => {
            void change('updateNotificationsEnabled', value);
          }}
        />
      </SettingsRow>
    </>
  );
}
