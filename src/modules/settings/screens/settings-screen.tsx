import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Modal, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { appConfig, releaseLinks } from '@core/config';
import { HealthConnectCard } from '@modules/health-connect';
import { ReminderCard } from '@modules/reminders';
import { trackEvent } from '@platform/telemetry';
import {
  AppScreen,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { SegmentedSetting } from '../components/segmented-setting';
import { SettingsRow } from '../components/settings-row';
import { SettingsSection } from '../components/settings-section';
import { useSettings } from '../hooks/use-settings';
import type { MeasurementUnit, ThemePreference } from '../types';

const themeOptions: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const unitOptions: { label: string; value: MeasurementUnit }[] = [
  { label: 'ml', value: 'ml' },
  { label: 'oz', value: 'oz' },
];

const startOfDayOptions = [
  { label: 'Midnight', value: '00:00' },
  { label: '4 AM', value: '04:00' },
  { label: '6 AM', value: '06:00' },
] as const;

const openUrl = async (url: string, fallbackMessage: string) => {
  if (url.length === 0) {
    Alert.alert('Link unavailable', fallbackMessage);
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open link', fallbackMessage);
  }
};

export function SettingsScreen() {
  const theme = useTheme<AppTheme>();
  const {
    appInformation,
    clearExport,
    dataSummary,
    exportPayload,
    goalAmountInUnit,
    importDatabase,
    isBusy,
    prepareExport,
    reminders,
    resetHistory,
    sendTestNotification,
    settings,
    statusMessage,
    updateGoalAmount,
    updateMeasurementUnit,
    updateReduceMotion,
    updateShareAnonymousDiagnostics,
    updateStartOfDay,
    updateThemePreference,
  } = useSettings();
  const [goalDraft, setGoalDraft] = useState<
    { unit: MeasurementUnit; value: string } | undefined
  >();
  const [importPayload, setImportPayload] = useState('');
  const [importVisible, setImportVisible] = useState(false);
  const goalInput =
    goalDraft?.unit === settings.measurementUnit ? goalDraft.value : String(goalAmountInUnit);

  const confirmGoalUpdate = () => {
    const parsedAmount = Number.parseInt(goalInput, 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Goal needs a number', 'Enter a daily goal greater than zero.');
      return;
    }

    updateGoalAmount(parsedAmount);
    setGoalDraft(undefined);
  };

  const confirmResetStatistics = () => {
    Alert.alert(
      'Reset statistics?',
      'Statistics are calculated from local hydration history. This clears the local history used for charts and streaks.',
      [
        { style: 'cancel', text: 'Keep data' },
        {
          onPress: () => {
            void resetHistory();
          },
          style: 'destructive',
          text: 'Reset',
        },
      ],
    );
  };

  const confirmDeleteHistory = () => {
    Alert.alert(
      'Delete all hydration history?',
      'This removes every local water log from this device. It cannot be undone.',
      [
        { style: 'cancel', text: 'Keep history' },
        {
          onPress: () => {
            void resetHistory();
          },
          style: 'destructive',
          text: 'Delete',
        },
      ],
    );
  };

  const confirmImport = () => {
    Alert.alert(
      'Import hydration data?',
      'This replaces the local hydration history on this device with the imported export.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: async () => {
            try {
              await importDatabase(importPayload);
              setImportPayload('');
              setImportVisible(false);
            } catch {
              Alert.alert('Import failed', 'Use a valid Water Reminder export.');
            }
          },
          text: 'Import',
        },
      ],
    );
  };

  const showPrivacyPolicy = () => {
    trackEvent('privacy_policy_opened', { source: 'app' });
    if (releaseLinks.privacyPolicyUrl.length > 0) {
      void openUrl(releaseLinks.privacyPolicyUrl, 'The privacy policy is not available yet.');
      return;
    }

    Alert.alert(
      'Privacy Policy',
      'Hydration records and Health Connect data are stored locally and are never included in telemetry. When enabled, anonymous usage events and crash diagnostics may be sent to Google Firebase to improve reliability.',
    );
  };

  const showTerms = () => {
    trackEvent('terms_opened', { source: 'app' });
    if (releaseLinks.termsUrl.length > 0) {
      void openUrl(releaseLinks.termsUrl, 'The terms are not available yet.');
      return;
    }

    Alert.alert(
      'Terms',
      'Water Reminder is a general wellness utility. It does not provide medical advice. You control local data, reminders, and optional Health Connect access from this device.',
    );
  };

  const showOpenSourceLicenses = () => {
    if (releaseLinks.licensesUrl.length > 0) {
      void openUrl(releaseLinks.licensesUrl, 'Open source notices are not available yet.');
      return;
    }

    Alert.alert(
      'Open Source Licenses',
      'This app is built with open-source software including Expo, React Native, React Native Paper, Redux Toolkit, React Query, Reanimated, MMKV, SQLite, React Native Firebase, Health Connect libraries, and Android Jetpack Glance. Notices are included with the release documentation.',
    );
  };

  const openFeedback = () => {
    trackEvent('feedback_opened', { source: 'app' });
    void openUrl(
      `mailto:${releaseLinks.feedbackEmail}?subject=${encodeURIComponent(`${appConfig.name} feedback`)}`,
      'Open your email app and mention Water Reminder feedback in the subject.',
    );
  };

  const openRateApp = () => {
    trackEvent('rate_app_opened', { source: 'app' });
    void openUrl(
      releaseLinks.playStoreUrl,
      'Search for Water Reminder in Google Play to rate the app.',
    );
  };

  const openGitHub = () => {
    void openUrl(
      releaseLinks.githubUrl,
      'The public source link will be added when the repository is published.',
    );
  };

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => {
            router.back();
          }}
          style={styles.headerButton}
        />
        <View style={styles.headerCopy}>
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
            Settings
          </Text>
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
            Personalize Water Reminder without adding clutter.
          </Text>
        </View>
      </View>

      {statusMessage === undefined ? null : (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.statusMessage,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: theme.app.radius.md,
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {statusMessage}
        </Text>
      )}

      <SettingsSection subtitle="Daily hydration stays personal and local." title="General">
        <View style={styles.goalEditor}>
          <SettingsRow
            icon="target"
            label="Daily goal"
            supportingText={`Current unit: ${settings.measurementUnit}`}
          />
          <View style={styles.inlineForm}>
            <TextInput
              accessibilityLabel="Daily hydration goal"
              keyboardType="number-pad"
              onChangeText={(value) => {
                setGoalDraft({
                  unit: settings.measurementUnit,
                  value: value.replace(/\D/g, ''),
                });
              }}
              style={[
                styles.input,
                {
                  backgroundColor: theme.app.colors.surfaceSubtle,
                  borderColor: theme.app.colors.borderSubtle,
                  borderRadius: theme.app.radius.md,
                  color: theme.app.colors.textPrimary,
                  fontSize: theme.app.typography.fontSize.body,
                },
              ]}
              value={goalInput}
            />
            <PrimaryButton
              accessibilityLabel="Save daily hydration goal"
              disabled={isBusy}
              icon="check"
              label="Save"
              onPress={confirmGoalUpdate}
              style={styles.saveButton}
            />
          </View>
        </View>
        <SettingsRow icon="cup-water" label="Measurement unit">
          <SegmentedSetting
            accessibilityLabel="Measurement unit"
            onChange={updateMeasurementUnit}
            options={unitOptions}
            value={settings.measurementUnit}
          />
        </SettingsRow>
        <SettingsRow icon="weather-sunset-up" label="Start of day">
          <SegmentedSetting
            accessibilityLabel="Start of day"
            onChange={updateStartOfDay}
            options={startOfDayOptions}
            value={settings.startOfDay}
          />
        </SettingsRow>
        <SettingsRow
          icon="translate"
          label="Language"
          supportingText="Uses the device language when translations are available."
          value="System"
        />
      </SettingsSection>

      <SettingsSection
        subtitle="Respect your device while keeping the app readable."
        title="Appearance"
      >
        <SettingsRow icon="theme-light-dark" label="Theme">
          <SegmentedSetting
            accessibilityLabel="Theme preference"
            onChange={updateThemePreference}
            options={themeOptions}
            value={settings.themePreference}
          />
        </SettingsRow>
        <SettingsRow
          icon="pause-circle-outline"
          label="Reduce motion"
          supportingText="Keeps transitions quieter across product surfaces."
        >
          <Switch
            accessibilityLabel="Reduce motion"
            onValueChange={updateReduceMotion}
            value={settings.reduceMotion}
          />
        </SettingsRow>
        <SettingsRow
          icon="format-size"
          label="Large text preview"
          supportingText="Hydration should stay readable with larger system text."
          value="Aa"
        />
      </SettingsSection>

      <SettingsSection
        subtitle="Anonymous diagnostics never include hydration or Health Connect data."
        title="Privacy"
      >
        <SettingsRow
          icon="chart-box-outline"
          label="Share anonymous diagnostics"
          supportingText="Help improve Water Reminder by sharing anonymous app usage and crash diagnostics. Hydration and Health Connect data are never included."
        >
          <Switch
            accessibilityLabel="Share anonymous diagnostics"
            onValueChange={(enabled) => {
              void updateShareAnonymousDiagnostics(enabled);
            }}
            value={settings.shareAnonymousDiagnostics}
          />
        </SettingsRow>
      </SettingsSection>

      <View style={styles.sectionGroup}>
        <SectionHeader
          subtitle="Reminder controls reuse the same gentle engine from Home."
          title="Notifications"
        />
        <ReminderCard
          defaultSnoozeMinutes={reminders.preferences.defaultSnoozeMinutes}
          enabled={reminders.preferences.enabled}
          intervalMinutes={reminders.preferences.intervalMinutes}
          mode={reminders.preferences.mode}
          onDefaultSnoozeChange={reminders.updateDefaultSnooze}
          onIntervalChange={reminders.updateInterval}
          onModeChange={reminders.updateMode}
          onPause={(option) => {
            void reminders.pause(option);
          }}
          onResume={reminders.resume}
          onSleepTimeChange={reminders.updateSleepTime}
          onSnoozeEnabledChange={reminders.updateSnoozeEnabled}
          onSoundChange={(sound) => {
            void reminders.updateSound(sound);
          }}
          onToggleEnabled={() => {
            void reminders.toggleEnabled();
          }}
          onVibrationChange={reminders.updateVibration}
          onWakeTimeChange={reminders.updateWakeTime}
          permissionMessage={reminders.permissionMessage}
          preview={reminders.preview}
          sleepTime={reminders.preferences.sleepTime}
          snoozeEnabled={reminders.preferences.snoozeEnabled}
          sound={reminders.preferences.sound}
          status={reminders.status}
          summary={reminders.summary}
          vibrationEnabled={reminders.preferences.vibrationEnabled}
          wakeTime={reminders.preferences.wakeTime}
        />
        <SecondaryButton
          accessibilityLabel="Send a test notification"
          disabled={isBusy}
          icon="bell-ring"
          label="Test notification"
          onPress={() => {
            void sendTestNotification();
          }}
        />
      </View>

      <View style={styles.sectionGroup}>
        <HealthConnectCard />
      </View>

      <SettingsSection subtitle="Your hydration data stays on this device." title="Data">
        <SettingsRow
          icon="database-outline"
          label="Database size"
          value={dataSummary.databaseSize}
        />
        <SettingsRow
          icon="format-list-numbered"
          label="Total hydration entries"
          value={String(dataSummary.totalEntries)}
        />
        <SettingsRow
          icon="export-variant"
          label="Export database"
          onPress={() => {
            void prepareExport();
          }}
          supportingText="Prepare a local JSON export."
        />
        <SettingsRow
          icon="import"
          label="Import database"
          onPress={() => {
            setImportVisible(true);
          }}
          supportingText="Replace local history from a Water Reminder export."
        />
        <SettingsRow
          destructive
          icon="chart-line"
          label="Reset statistics"
          onPress={confirmResetStatistics}
          supportingText="Clears the local history used by statistics."
        />
        <SettingsRow
          destructive
          icon="trash-can-outline"
          label="Delete all hydration history"
          onPress={confirmDeleteHistory}
          supportingText="Removes every local water log from this device."
        />
      </SettingsSection>

      <SettingsSection
        subtitle="Release information, privacy, and ways to support the app."
        title="About"
      >
        <SettingsRow icon="cellphone" label="Application version" value={appInformation.version} />
        <SettingsRow icon="hammer-wrench" label="Build number" value={appInformation.buildNumber} />
        <SettingsRow
          icon="shield-lock-outline"
          label="Privacy Policy"
          onPress={showPrivacyPolicy}
          value="View"
        />
        <SettingsRow icon="file-document-outline" label="Terms" onPress={showTerms} value="View" />
        <SettingsRow
          icon="source-branch"
          label="Open Source Licenses"
          onPress={showOpenSourceLicenses}
          value="View"
        />
        {releaseLinks.githubUrl.length > 0 ? (
          <SettingsRow icon="github" label="GitHub" onPress={openGitHub} value="Open" />
        ) : null}
        <SettingsRow
          icon="message-text-outline"
          label="Feedback"
          onPress={openFeedback}
          value="Email"
        />
        <SettingsRow
          icon="star-outline"
          label="Rate App"
          onPress={openRateApp}
          value="Google Play"
        />
      </SettingsSection>

      <ExportModal onClose={clearExport} payload={exportPayload} theme={theme} />
      <ImportModal
        importPayload={importPayload}
        onCancel={() => {
          setImportVisible(false);
          setImportPayload('');
        }}
        onChange={setImportPayload}
        onImport={confirmImport}
        theme={theme}
        visible={importVisible}
      />
    </AppScreen>
  );
}

function ExportModal({
  onClose,
  payload,
  theme,
}: {
  onClose: () => void;
  payload?: string;
  theme: AppTheme;
}) {
  return (
    <Modal animationType="fade" transparent visible={payload !== undefined}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.app.radius.lg,
            },
          ]}
        >
          <SectionHeader
            subtitle="This local export can be imported again from Settings."
            title="Export ready"
          />
          <TextInput
            accessibilityLabel="Hydration database export"
            editable={false}
            multiline
            style={[
              styles.payloadInput,
              {
                backgroundColor: theme.app.colors.surfaceSubtle,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
                color: theme.app.colors.textPrimary,
                fontSize: theme.app.typography.fontSize.caption,
              },
            ]}
            value={payload}
          />
          <PrimaryButton label="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function ImportModal({
  importPayload,
  onCancel,
  onChange,
  onImport,
  theme,
  visible,
}: {
  importPayload: string;
  onCancel: () => void;
  onChange: (value: string) => void;
  onImport: () => void;
  theme: AppTheme;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.app.radius.lg,
            },
          ]}
        >
          <SectionHeader
            subtitle="Import replaces local hydration history on this device."
            title="Import database"
          />
          <TextInput
            accessibilityLabel="Water Reminder export JSON"
            multiline
            onChangeText={onChange}
            placeholder="Paste Water Reminder export JSON"
            placeholderTextColor={theme.app.colors.textSecondary}
            style={[
              styles.payloadInput,
              {
                backgroundColor: theme.app.colors.surfaceSubtle,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
                color: theme.app.colors.textPrimary,
                fontSize: theme.app.typography.fontSize.caption,
              },
            ]}
            value={importPayload}
          />
          <View style={styles.modalActions}>
            <SecondaryButton label="Cancel" onPress={onCancel} style={styles.modalButton} />
            <PrimaryButton label="Import" onPress={onImport} style={styles.modalButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  goalEditor: {
    gap: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  inlineForm: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalButton: {
    flexGrow: 1,
  },
  modalCard: {
    gap: 16,
    maxWidth: 560,
    padding: 20,
    width: '100%',
  },
  payloadInput: {
    borderWidth: 1,
    maxHeight: 260,
    minHeight: 180,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    minHeight: 52,
    paddingHorizontal: 20,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 640,
    width: '100%',
  },
  sectionGroup: {
    gap: 12,
  },
  statusMessage: {
    fontWeight: '700',
    padding: 12,
    textAlign: 'center',
  },
  subtitle: {},
  title: {
    fontWeight: '800',
  },
});
