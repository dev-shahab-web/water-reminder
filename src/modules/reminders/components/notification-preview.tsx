import { StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { useTheme } from 'react-native-paper';

import { GlassIllustration } from '@modules/hydration/components/glass-illustration';
import { useQuickAddPresets } from '@modules/hydration/hooks/use-quick-add-presets';
import { formatGlassCapacity } from '@modules/hydration/utils/glass-options';
import { useSettingsSnapshot } from '@modules/settings/hooks/use-settings';
import { GlassSurface } from '@shared/components/glass-surface';
import { MaterialCommunityIcon } from '@shared/components';
import type { AppTheme } from '@shared/theme';

export function NotificationPreview({
  snoozeEnabled,
  snoozeMinutes,
}: {
  snoozeEnabled: boolean;
  snoozeMinutes: number;
}) {
  const theme = useTheme<AppTheme>();
  const { presets } = useQuickAddPresets();
  const { measurementUnit } = useSettingsSnapshot();
  const amount = presets[0]?.amountMl ?? 250;
  const label = formatGlassCapacity(amount, measurementUnit);
  const ink = { color: theme.app.colors.textPrimary };
  const muted = { color: theme.app.colors.textSecondary };
  const accent = { color: theme.colors.primary };

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.heading, ink]}>
        Your notification
      </Text>
      <GlassSurface style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcon name="water" color={theme.colors.primary} size={18} />
          <Text style={[styles.caption, muted]}>Water Reminder · A moment for you</Text>
        </View>
        <View style={styles.content}>
          <View style={[styles.art, { backgroundColor: theme.app.colors.surfaceSubtle }]}>
            <GlassIllustration amountMl={amount} compact scale={0.75} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.eyebrow, accent]}>{label} · YOUR GLASS</Text>
            <Text style={[styles.title, ink]}>Time to hydrate</Text>
            <Text style={[styles.message, muted]}>A small sip keeps the habit going.</Text>
          </View>
        </View>
        <View style={styles.actions} accessibilityLabel="Notification action preview">
          <Text style={[styles.action, accent]}>Log {label}</Text>
          {snoozeEnabled && <Text style={[styles.action, accent]}>Snooze {snoozeMinutes}m</Text>}
          <Text style={[styles.action, muted]}>Dismiss</Text>
        </View>
      </GlassSurface>
      <Text style={[styles.caption, muted]}>
        Uses your first glass in My glasses. Expand a notification to see its actions.
        {'\n'}Preview — appearance follows your Android device.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  heading: { fontSize: 20, fontWeight: '700' },
  card: { borderRadius: 24, padding: 18, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caption: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  art: { borderRadius: 16, paddingBottom: 6 },
  copy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  action: { fontSize: 13, fontWeight: '700', paddingVertical: 6 },
});
