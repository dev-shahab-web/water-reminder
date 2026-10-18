import { useState } from 'react';
import { Alert, Linking, Switch } from 'react-native';

import { premiumConfig } from '@core/config/premium-config';
import { SettingsRow } from '@modules/settings/components/settings-row';
import { requestNotificationPermissions } from '@platform/notifications';
import { useAppSelector } from '@state/store/hooks';
import { changeDailyOffers, ensurePremiumPromotionChannel } from '../services/premium-promotions';

export function PremiumPromotionSettings() {
  const { access, pending, preferences, status } = useAppSelector((state) => state.premium);
  const [busy, setBusy] = useState(false);
  const { hour, minute } = premiumConfig.promotions.dailyReminder;
  const time = new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const change = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled) {
        await ensurePremiumPromotionChannel();
        const permission = await requestNotificationPermissions();
        if (!permission.granted) {
          Alert.alert(
            'Notifications are off',
            'Enable notifications in Android settings to receive Plus tips and offers.',
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
      }
      await changeDailyOffers(enabled);
    } catch {
      Alert.alert(
        'Reminder update failed',
        'Please try again. You can also turn off Plus tips & offers in Android notification settings.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SettingsRow
      icon="star-four-points-outline"
      label="Daily Plus tips & offers"
      supportingText={
        access.active || pending
          ? 'Upgrade reminders are stopped while Plus is active or a payment is pending.'
          : `One silent reminder around ${time} about widgets, themes and icons. Optional; turn off anytime.${status === 'unavailable' ? ' Starts when Google Play plans are available.' : ''}`
      }
    >
      <Switch
        testID="premium-daily-offers"
        accessibilityLabel="Daily Plus tips and offers"
        value={preferences.dailyOffers && !access.active && !pending}
        disabled={busy || access.active || pending}
        onValueChange={(value) => {
          void change(value);
        }}
      />
    </SettingsRow>
  );
}
