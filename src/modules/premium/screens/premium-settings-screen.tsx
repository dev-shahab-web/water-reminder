import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { Icon, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

import { premiumConfig } from '@core/config/premium-config';
import { SettingsRow } from '@modules/settings/components/settings-row';
import { SettingsSection } from '@modules/settings/components/settings-section';
import { AppScreen, BrandMark, IconButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';
import { isPremiumThemeId } from '@shared/theme/premium-themes';
import { usePremiumAccess } from '../hooks/use-premium-access';
import { ThemeStudio } from '../components/theme-studio';
import { useAppSelector } from '@state/store/hooks';
import { PremiumBanner } from '../components/premium-banner';
import { PremiumPromotionSettings } from '../components/premium-promotion-settings';
import { openPremiumWebsite } from '../services/premium-promotions';
import {
  changePremiumIcon,
  changePremiumTheme,
  supportsAppIcons,
} from '../services/premium-service';
import type { PremiumIconId, PremiumThemeId } from '../types';

const icons = [
  { id: 'default', name: 'Original', color: '#007A8A' },
  { id: 'midnight', name: 'Midnight', color: '#142738' },
  { id: 'jade', name: 'Jade', color: '#174B43' },
  { id: 'rose', name: 'Rose', color: '#613B50' },
  { id: 'violet', name: 'Dusk', color: '#46365D' },
  { id: 'expressive', name: 'Expressive', color: '#006B5A' },
] as const;

export function PremiumSettingsScreen() {
  const theme = useTheme<AppTheme>();
  const { preferences } = useAppSelector((state) => state.premium);
  const active = usePremiumAccess();
  const { previewTheme } = useLocalSearchParams<{ previewTheme?: string }>();
  const [themeMessage, setThemeMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const color = theme.app.colors.textPrimary;
  const openPaywall = () => router.push('/paywall');
  const selectTheme = (id: PremiumThemeId) => {
    if (id !== 'default' && !active) return openPaywall();
    try {
      changePremiumTheme(id);
      setThemeMessage('Theme applied. Your new look is ready across the app.');
    } catch {
      setThemeMessage(
        'Plus access could not be confirmed. Restore your purchase to apply this theme.',
      );
      openPaywall();
    }
  };
  const selectIcon = async (id: PremiumIconId) => {
    if (id !== 'default' && !active) return openPaywall();
    setBusy(true);
    try {
      await changePremiumIcon(id);
    } catch (error) {
      Alert.alert('Icon unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen scrollable>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
        />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color }]}>
            Your Plus
          </Text>
          <Text style={{ color: theme.app.colors.textSecondary }}>
            Small details. A more personal daily ritual.
          </Text>
        </View>
      </View>
      {!active && <PremiumBanner />}
      <SettingsSection
        title="Theme studio"
        subtitle="Color, typography and icons. Made to feel like you."
      >
        <ThemeStudio
          active={active}
          applied={active ? preferences.theme : 'default'}
          onApply={selectTheme}
          initialSelection={isPremiumThemeId(previewTheme) ? previewTheme : undefined}
          onUnlock={(id) => router.push({ pathname: '/paywall', params: { previewTheme: id } })}
        />
        {!!themeMessage && (
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.onSurfaceVariant }}>
            {themeMessage}
          </Text>
        )}
      </SettingsSection>
      <SettingsSection
        title="Premium app icons"
        subtitle="A little personality on your Android home screen."
      >
        <View style={styles.choices}>
          {icons.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityState={{
                checked: (active ? preferences.icon : 'default') === item.id,
                disabled: busy || !supportsAppIcons(),
              }}
              accessibilityLabel={`${item.name} app icon${item.id !== 'default' && !active ? ', requires Plus' : ''}`}
              disabled={busy || !supportsAppIcons()}
              onPress={() => void selectIcon(item.id)}
              style={[
                styles.choice,
                {
                  borderColor:
                    (active ? preferences.icon : 'default') === item.id
                      ? theme.colors.primary
                      : theme.app.colors.borderSubtle,
                },
              ]}
            >
              <View style={[styles.iconSwatch, { backgroundColor: item.color }]}>
                {item.id === 'default' ? (
                  <BrandMark size={60} />
                ) : (
                  <Svg width={60} height={60} viewBox="0 0 108 108" accessible={false}>
                    <Path
                      fill="#EED6A3"
                      d="M54,23C49,36 32,51 32,65A22,22 0,0 0,76 65C76,51 59,36 54,23Z"
                    />
                    <Path
                      stroke="#FFF8E8"
                      strokeWidth={3}
                      strokeLinecap="round"
                      fill="none"
                      d="M41,62C39,72 45,78 51,79"
                    />
                  </Svg>
                )}
              </View>
              <Text style={[styles.choiceLabel, { color }]}>{item.name}</Text>
              {!active && item.id !== 'default' && (
                <Icon source="lock-outline" color={theme.app.colors.textSecondary} size={13} />
              )}
            </Pressable>
          ))}
        </View>
        <Text style={{ color: theme.app.colors.textSecondary, fontSize: 12 }}>
          Your launcher may take a moment to update the icon.
        </Text>
      </SettingsSection>
      <SettingsSection title="Plus, wherever you are">
        <SettingsRow
          icon="view-dashboard-outline"
          label="Home screen widgets"
          value={active ? 'Enabled' : 'Plus'}
          supportingText="See your progress and log water from your home screen."
          onPress={() =>
            active
              ? Alert.alert(
                  'Add a widget',
                  'Touch and hold an empty space on your home screen, choose Widgets, then select Water Reminder.',
                )
              : openPaywall()
          }
        />
        <SettingsRow
          icon="watch-variant"
          label="Wear OS companion"
          value={premiumConfig.features.wearOs.available ? 'Plus' : 'Coming soon'}
          supportingText="Daily progress and quick water logging, with your phone’s theme."
          onPress={() => router.push('/wear-settings')}
        />
      </SettingsSection>
      <SettingsSection title="Your membership">
        <SettingsRow
          icon="web"
          label="Explore Lumarc Studio"
          supportingText="App news, Plus benefits and promotions on our website."
          onPress={() => {
            void openPremiumWebsite('settings');
          }}
        />
        <PremiumPromotionSettings />
        <SettingsRow
          icon="star-four-points"
          label="Water Reminder Plus"
          value={active ? 'Active' : 'Free plan'}
          onPress={openPaywall}
        />
        <SettingsRow icon="restore" label="Purchases & restore" onPress={openPaywall} />
        {active && (
          <SettingsRow
            icon="google-play"
            label="Manage subscriptions"
            supportingText="View or cancel recurring plans in Google Play."
            onPress={() => {
              void Linking.openURL('https://play.google.com/store/account/subscriptions').catch(
                () =>
                  Alert.alert(
                    'Open Google Play',
                    'Go to Payments & subscriptions, then Subscriptions.',
                  ),
              );
            }}
          />
        )}
      </SettingsSection>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  copy: { flex: 1, gap: 6 },
  title: { fontSize: 26, fontWeight: '700' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: {
    flexGrow: 1,
    flexBasis: '42%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
  },
  choiceLabel: { fontSize: 13, fontWeight: '600' },
  iconSwatch: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
