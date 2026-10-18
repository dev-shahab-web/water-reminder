import { useEffect, useSyncExternalStore } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { router } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { AppScreen, IconButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';
import { UpdateCard } from '../components/update-card';
import {
  checkForAppUpdate,
  getEngagementSnapshot,
  openPlayStore,
  performAppUpdate,
  subscribeEngagement,
} from '../services/engagement-service';

export function UpdatesScreen() {
  const theme = useTheme<AppTheme>();
  const { update, checking, busy } = useSyncExternalStore(
    subscribeEngagement,
    getEngagementSnapshot,
    getEngagementSnapshot,
  );
  useEffect(() => {
    void checkForAppUpdate();
  }, []);
  const start = async () => {
    try {
      await performAppUpdate();
    } catch {
      Alert.alert('Update unavailable', 'Please try again, or update from Google Play.');
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
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: theme.app.colors.textPrimary }]}
        >
          App updates
        </Text>
      </View>
      <UpdateCard
        update={update}
        checking={checking}
        busy={busy}
        onUpdate={() => {
          void start();
        }}
        onCheck={() => {
          void checkForAppUpdate();
        }}
        onStore={() => {
          void openPlayStore().catch(() =>
            Alert.alert(
              'Store unavailable',
              'Please open Google Play and search for Water Reminder.',
            ),
          );
        }}
      />
      <Text style={{ color: theme.app.colors.textSecondary, lineHeight: 21 }}>
        Update availability may vary by device and rollout. Google Play handles the download and
        installation.
      </Text>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { fontSize: 26, fontWeight: '700' },
});
