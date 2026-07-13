import { memo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { useHealthConnect } from '../hooks/use-health-connect';
import {
  getHealthConnectAvailabilityCopy,
  getHealthConnectPermissionCopy,
} from '../utils/health-connect-copy';

export const HealthConnectCard = memo(function HealthConnectCard() {
  const theme = useTheme<AppTheme>();
  const { connect, disconnect, isBusy, state, syncNow, syncResult } = useHealthConnect();
  const connected = state.permissionState.granted;

  const confirmDisconnect = () => {
    Alert.alert(
      'Disconnect Health Connect?',
      'Water Reminder will stop syncing hydration with Health Connect. Local tracking stays available.',
      [
        { style: 'cancel', text: 'Keep connected' },
        {
          onPress: () => {
            void disconnect();
          },
          style: 'destructive',
          text: 'Disconnect',
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <SectionHeader
        subtitle="Optional local sync for hydration records only."
        title="Health Connect"
      />
      <Text
        style={[
          styles.copy,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        Water Reminder can read hydration from Health Connect and write water you log here. No
        account, cloud, ads, or unrelated health data.
      </Text>
      <View style={styles.statusGroup}>
        <StatusLine
          label="Availability"
          value={getHealthConnectAvailabilityCopy(state.availability)}
        />
        <StatusLine
          label="Permission"
          value={getHealthConnectPermissionCopy(state.permissionState)}
        />
        <StatusLine
          label="Last sync"
          value={
            state.lastSyncIso === undefined
              ? 'Not synced yet.'
              : new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(state.lastSyncIso))
          }
        />
        {state.lastError === undefined ? null : (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              {
                color: theme.app.colors.statusWarning,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {state.lastError}
          </Text>
        )}
        {syncResult === undefined ? null : (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.result,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {syncResult.writtenCount} written, {syncResult.importedCount} imported,{' '}
            {syncResult.skippedCount} already known.
          </Text>
        )}
      </View>
      {connected ? (
        <View style={styles.actions}>
          <PrimaryButton
            disabled={isBusy}
            icon="sync"
            label="Sync now"
            onPress={() => {
              void syncNow();
            }}
            style={styles.action}
          />
          <SecondaryButton
            disabled={isBusy}
            icon="link-off"
            label="Disconnect"
            onPress={confirmDisconnect}
            style={styles.action}
          />
        </View>
      ) : (
        <PrimaryButton
          disabled={isBusy || state.availability !== 'available'}
          icon="heart-pulse"
          label="Connect Health Connect"
          onPress={() => {
            void connect();
          }}
        />
      )}
    </View>
  );
});

function StatusLine({ label, value }: { label: string; value: string }) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.statusLine}>
      <Text
        style={[
          styles.statusLabel,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statusValue,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flexBasis: 140,
    flexGrow: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  copy: {},
  error: {},
  result: {},
  statusGroup: {
    gap: 8,
  },
  statusLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusLine: {
    gap: 2,
  },
  statusValue: {
    fontWeight: '700',
  },
});
