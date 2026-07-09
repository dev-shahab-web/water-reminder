import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

export default function HomeScreen() {
  const theme = useTheme<AppTheme>();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, padding: theme.app.spacing[6] },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.onBackground,
            fontSize: theme.app.typography.fontSize.title,
            lineHeight: theme.app.typography.lineHeight.title,
          },
        ]}
      >
        RN Enterprise Starter
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
            marginTop: theme.app.spacing[2],
          },
        ]}
      >
        Platform foundation initialized.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
