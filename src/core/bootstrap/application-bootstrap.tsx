import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { logger } from '@core/logger';
import { initializeDatabase } from '@platform/database';
import { initializeNotifications } from '@platform/notifications';
import { initializeStorage } from '@platform/storage';
import type { AppTheme } from '@shared/theme';

SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  logger.warn('Unable to prevent splash screen auto hide.', { error });
});

export function ApplicationBootstrap({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme<AppTheme>();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        initializeStorage();
        await Promise.all([initializeDatabase(), initializeNotifications()]);
        logger.info('Application bootstrap completed.');
      } catch (error) {
        logger.error('Application bootstrap failed.', { error });
      } finally {
        if (isMounted) {
          setIsReady(true);
        }

        await SplashScreen.hideAsync();
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
