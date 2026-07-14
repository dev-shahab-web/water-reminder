import { type ReactElement, type ReactNode } from 'react';
import {
  ScrollView,
  type RefreshControlProps,
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppTheme } from '@shared/theme';

type AppScreenProps = {
  children: ReactNode;
  error?: ReactNode;
  loading?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
};

export function AppScreen({
  children,
  error,
  loading,
  refreshControl,
  scrollable = false,
  style,
  subtitle,
  title,
}: AppScreenProps) {
  const theme = useTheme<AppTheme>();
  const content = error ?? loading ?? children;

  const header =
    title === undefined ? null : (
      <View style={styles.header}>
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
          {title}
        </Text>
        {subtitle === undefined ? null : (
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
            {subtitle}
          </Text>
        )}
      </View>
    );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.app.colors.surfaceBase,
        },
      ]}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              padding: theme.app.spacing[6],
            },
            style,
          ]}
          refreshControl={refreshControl}
        >
          {header}
          {content}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.staticContent,
            {
              padding: theme.app.spacing[6],
            },
            style,
          ]}
        >
          {header}
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 24,
  },
  staticContent: {
    flex: 1,
    gap: 24,
  },
  subtitle: {
    maxWidth: 520,
  },
  title: {
    fontWeight: '700',
  },
});
