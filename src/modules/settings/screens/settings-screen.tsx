import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { ReminderCard } from '@modules/reminders';
import { AppScreen, PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
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

  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <SecondaryButton
          accessibilityLabel="Go back to Home"
          label="Back"
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
              label="Save"
              onPress={confirmGoalUpdate}
              style={styles.saveButton}
            />
          </View>
        </View>
        <SettingsRow label="Measurement unit">
          <SegmentedSetting
            accessibilityLabel="Measurement unit"
            onChange={updateMeasurementUnit}
            options={unitOptions}
            value={settings.measurementUnit}
          />
        </SettingsRow>
        <SettingsRow label="Start of day">
          <SegmentedSetting
            accessibilityLabel="Start of day"
            onChange={updateStartOfDay}
            options={startOfDayOptions}
            value={settings.startOfDay}
          />
        </SettingsRow>
        <SettingsRow
          label="Language"
          supportingText="Uses the device language when translations are available."
          value="System"
        />
      </SettingsSection>

      <SettingsSection
        subtitle="Respect your device while keeping the app readable."
        title="Appearance"
      >
        <SettingsRow label="Theme">
          <SegmentedSetting
            accessibilityLabel="Theme preference"
            onChange={updateThemePreference}
            options={themeOptions}
            value={settings.themePreference}
          />
        </SettingsRow>
        <SettingsRow
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
          label="Large text preview"
          supportingText="Hydration should stay readable with larger system text."
          value="Aa"
        />
      </SettingsSection>

      <View style={styles.sectionGroup}>
        <SectionHeader
          subtitle="Reminder controls reuse the same gentle engine from Home."
          title="Notifications"
        />
        <ReminderCard
          enabled={reminders.preferences.enabled}
          intervalMinutes={reminders.preferences.intervalMinutes}
          onIntervalChange={reminders.updateInterval}
          onPause={(option) => {
            void reminders.pause(option);
          }}
          onResume={reminders.resume}
          onSleepTimeChange={reminders.updateSleepTime}
          onToggleEnabled={() => {
            void reminders.toggleEnabled();
          }}
          onWakeTimeChange={reminders.updateWakeTime}
          permissionMessage={reminders.permissionMessage}
          preview={reminders.preview}
          sleepTime={reminders.preferences.sleepTime}
          status={reminders.status}
          summary={reminders.summary}
          wakeTime={reminders.preferences.wakeTime}
        />
        <SecondaryButton
          accessibilityLabel="Send a test notification"
          disabled={isBusy}
          label="Test notification"
          onPress={() => {
            void sendTestNotification();
          }}
        />
      </View>

      <SettingsSection subtitle="Your hydration data stays on this device." title="Data">
        <SettingsRow label="Database size" value={dataSummary.databaseSize} />
        <SettingsRow label="Total hydration entries" value={String(dataSummary.totalEntries)} />
        <SettingsRow
          label="Export database"
          onPress={() => {
            void prepareExport();
          }}
          supportingText="Prepare a local JSON export."
        />
        <SettingsRow
          label="Import database"
          onPress={() => {
            setImportVisible(true);
          }}
          supportingText="Replace local history from a Water Reminder export."
        />
        <SettingsRow
          destructive
          label="Reset statistics"
          onPress={confirmResetStatistics}
          supportingText="Clears the local history used by statistics."
        />
        <SettingsRow
          destructive
          label="Delete all hydration history"
          onPress={confirmDeleteHistory}
          supportingText="Removes every local water log from this device."
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="Application version" value={appInformation.version} />
        <SettingsRow label="Build number" value={appInformation.buildNumber} />
        <SettingsRow label="Privacy Policy" value="Coming soon" />
        <SettingsRow label="Terms" value="Coming soon" />
        <SettingsRow label="Open Source Licenses" value="Coming soon" />
        <SettingsRow label="GitHub" value="Coming soon" />
        <SettingsRow label="Feedback" value="Coming soon" />
        <SettingsRow label="Rate App" value="Coming soon" />
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
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
