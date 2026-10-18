import { StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { Icon, ProgressBar, useTheme } from 'react-native-paper';
import { PrimaryButton, SecondaryButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';
import type { AppUpdate } from '../types';

export function UpdateCard({
  update,
  checking,
  busy,
  onUpdate,
  onCheck,
  onStore,
}: {
  update: AppUpdate;
  checking: boolean;
  busy: boolean;
  onUpdate: () => void;
  onCheck?: () => void;
  onStore?: () => void;
}) {
  const theme = useTheme<AppTheme>();
  const ready = update.state === 'downloaded';
  const downloading = update.state === 'downloading' || update.state === 'installing';
  const actionable = ready || update.state === 'available' || update.state === 'resume';
  const title = checking
    ? 'Checking Google Play…'
    : ready
      ? 'Ready when you are'
      : downloading
        ? 'Your update is on its way'
        : actionable
          ? 'A fresh version is ready'
          : update.state === 'up-to-date'
            ? 'You’re up to date'
            : 'Check for a fresh start';
  const copy = ready
    ? 'Your update has downloaded. Restart Water Reminder to finish installing it.'
    : downloading
      ? 'Google Play is handling your update. You can keep using Water Reminder.'
      : actionable
        ? 'Keep Water Reminder running at its best with the latest version from Google Play.'
        : update.state === 'up-to-date'
          ? 'Google Play has no newer version available for your device right now.'
          : 'We couldn’t confirm update availability. Check your connection and try again, or open Google Play.';
  return (
    <View
      testID="app-update-card"
      style={[styles.card, { backgroundColor: theme.app.colors.surfaceBase }]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon
          source={ready ? 'check-decagram-outline' : 'cellphone-arrow-down'}
          color={theme.colors.primary}
          size={34}
        />
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.app.colors.textPrimary }]}
      >
        {title}
      </Text>
      <Text style={[styles.copy, { color: theme.app.colors.textSecondary }]}>{copy}</Text>
      {downloading && (
        <ProgressBar
          testID="update-progress"
          indeterminate={update.totalBytes <= 0}
          progress={
            update.totalBytes > 0
              ? Math.min(1, Math.max(0, update.downloadedBytes / update.totalBytes))
              : 0
          }
          color={theme.colors.primary}
        />
      )}
      {actionable && (
        <PrimaryButton
          testID="app-update-action"
          disabled={busy || checking}
          label={
            busy
              ? 'Opening Google Play…'
              : ready
                ? 'Restart to update'
                : update.state === 'resume'
                  ? 'Resume update'
                  : 'Update now'
          }
          icon={ready ? 'restart' : 'download-outline'}
          onPress={onUpdate}
        />
      )}
      {onCheck && !actionable && (
        <PrimaryButton
          testID="app-check-update"
          disabled={checking || busy}
          label={checking ? 'Checking…' : 'Check for updates'}
          icon="refresh"
          onPress={onCheck}
        />
      )}
      {onStore && update.state === 'unavailable' && !checking && (
        <SecondaryButton label="Open Google Play" icon="google-play" onPress={onStore} />
      )}
      {actionable && (
        <Text style={[styles.note, { color: theme.app.colors.textSecondary }]}>
          Securely delivered by Google Play
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 24, gap: 18, width: '100%' },
  icon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  copy: { fontSize: 15, lineHeight: 23 },
  note: { fontSize: 12, textAlign: 'center' },
});
