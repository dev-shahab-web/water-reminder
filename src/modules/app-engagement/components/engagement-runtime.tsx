import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useTheme } from 'react-native-paper';
import type { AppTheme } from '@shared/theme';
import { logger } from '@core/logger';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';
import { SecondaryButton } from '@shared/components';
import { UpdateCard } from './update-card';
import {
  checkForAppUpdate,
  getEngagementSnapshot,
  initializeEngagement,
  performAppUpdate,
  shouldPromptForUpdate,
  snoozeUpdatePrompt,
  subscribeEngagement,
} from '../services/engagement-service';

export function EngagementRuntime() {
  const theme = useTheme<AppTheme>();
  const pathname = usePathname();
  const { update, checking, busy } = useSyncExternalStore(
    subscribeEngagement,
    getEngagementSnapshot,
    getEngagementSnapshot,
  );
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const refresh = async () => {
      try {
        await initializeEngagement();
        if (getOnboardingState().onboardingCompleted) await checkForAppUpdate();
      } catch (error) {
        logger.warn('Unable to initialize app update checks.', { error });
      }
    };
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    // Also enroll immediately after onboarding finishes without an app restart.
    if (pathname === '/')
      void initializeEngagement()
        .then(() => checkForAppUpdate())
        .catch(() => undefined);
  }, [pathname]);
  useEffect(() => {
    if (!foreground || !['downloading', 'installing'].includes(update.state)) return;
    const interval = setInterval(() => {
      void checkForAppUpdate();
    }, 10_000);
    return () => clearInterval(interval);
  }, [foreground, update.state]);
  const visible =
    foreground &&
    !busy &&
    (pathname === '/' || pathname === '/settings') &&
    getOnboardingState().onboardingCompleted &&
    shouldPromptForUpdate(update);
  const later = () => snoozeUpdatePrompt(update);
  const start = async () => {
    later();
    try {
      await performAppUpdate();
    } catch {
      Alert.alert('Update unavailable', 'Please try again from Settings → App updates.');
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={later}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
          <View accessibilityViewIsModal style={styles.panel}>
            <UpdateCard
              update={update}
              checking={checking}
              busy={busy}
              onUpdate={() => {
                void start();
              }}
            />
            <View style={[styles.later, { backgroundColor: theme.app.colors.surfaceBase }]}>
              <SecondaryButton testID="app-update-later" label="Maybe later" onPress={later} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 20, 26, 0.65)', padding: 24 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
  panel: { width: '100%', maxWidth: 480, gap: 12 },
  later: { borderRadius: 18 },
});
