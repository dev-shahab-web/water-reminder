import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppScreen, IconButton, PrimaryButton, SecondaryButton } from '@shared/components';
import { Text } from '@shared/components/themed-text';
import { GlassSurface } from '@shared/components/glass-surface';
import type { AppTheme } from '@shared/theme';
import { usePremiumAccess } from '@modules/premium/hooks/use-premium-access';
import { getWearStatus, requestWearSync, type WearStatus } from '@platform/wear/wear-native-module';
import { refreshHydrationWidgets } from '@modules/widgets';

export function WearSettingsScreen() {
  const theme = useTheme<AppTheme>();
  const access = usePremiumAccess();
  const [status, setStatus] = useState<WearStatus>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getWearStatus().then((next) => {
        if (active) setStatus(next);
      });
      return () => {
        active = false;
      };
    }, []),
  );
  const sync = async () => {
    setBusy(true);
    try {
      await refreshHydrationWidgets('settings_changed');
      await requestWearSync();
      const next = await getWearStatus();
      setStatus(next);
      setMessage(
        next.connectedWatches > 0
          ? 'Sync requested. Your watch will update shortly.'
          : 'Open Water Reminder on your paired watch, then try again.',
      );
    } catch {
      setMessage(
        'Couldn’t reach your watch. Your saved drinks are safe; try again when it reconnects.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" icon="back" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              {
                color: theme.colors.onSurface,
                fontFamily: theme.app.typography.fontFamily.display,
              },
            ]}
          >
            On your wrist
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Your day, a little closer.</Text>
        </View>
      </View>
      <GlassSurface style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
          Water Reminder for Wear OS
        </Text>
        <Text style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
          See your daily progress, log a glass, and undo a recent drink. Your goal, units, quick
          amounts and theme follow your phone.
        </Text>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.onSurfaceVariant }}>
          {status?.connectedWatches
            ? `Connected · ${status.watchName ?? 'Wear OS watch'}`
            : 'Waiting for your watch'}
        </Text>
      </GlassSurface>
      <GlassSurface style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          Connect once. Keep your rhythm.
        </Text>
        {[
          'Pair your Wear OS watch using its companion app.',
          'Install Water Reminder on your watch, then open it on both devices.',
          'Keep Plus active on your phone. Verified access carries over to your watch for up to 24 hours offline.',
        ].map((step, index) => (
          <Text key={step} style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            {index + 1}. {step}
          </Text>
        ))}
        <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
          Drinks saved while disconnected sync when your devices reconnect. Add the Daily hydration
          tile or a progress complication from your watch face settings.
        </Text>
      </GlassSurface>
      {access ? (
        <PrimaryButton
          label={busy ? 'Syncing…' : 'Sync watch'}
          accessibilityLabel="Sync watch"
          icon="sync"
          disabled={busy}
          onPress={() => {
            void sync();
          }}
        />
      ) : (
        <PrimaryButton
          label="Explore Plus"
          accessibilityLabel="Explore Plus"
          onPress={() => router.push('/paywall')}
        />
      )}
      <SecondaryButton
        label="Check connection"
        accessibilityLabel="Check watch connection"
        disabled={busy}
        onPress={() => {
          void sync();
        }}
      />
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.onSurfaceVariant }}>
          {message}
        </Text>
      )}
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  screen: { gap: 20, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 28, fontWeight: '700' },
  card: { padding: 20, gap: 14 },
  cardTitle: { fontSize: 19, fontWeight: '700' },
});
