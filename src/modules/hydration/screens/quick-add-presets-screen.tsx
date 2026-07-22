import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from 'react-native-paper';

import {
  AppScreen,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import type { AppTheme } from '@shared/theme';

import type { QuickAddPreset } from '../types';
import {
  maxQuickAddPresetAmountMl,
  maxQuickAddPresetCount,
  minQuickAddPresetAmountMl,
  validateQuickAddPresetAmount,
} from '../utils/quick-add-presets';
import { useQuickAddPresets } from '../hooks/use-quick-add-presets';

export function QuickAddPresetsScreen() {
  const theme = useTheme<AppTheme>();
  const { addPreset, movePreset, presets, removePreset, updatePreset } = useQuickAddPresets();
  const [draftAmount, setDraftAmount] = useState('');
  const [editingPreset, setEditingPreset] = useState<QuickAddPreset | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const resetDraft = () => {
    setDraftAmount('');
    setEditingPreset(undefined);
    setErrorMessage(undefined);
  };

  const savePreset = () => {
    const amountMl = Number.parseInt(draftAmount, 10);
    const validationMessage = validateQuickAddPresetAmount({
      amountMl,
      currentPresetId: editingPreset?.id,
      presets,
    });

    if (validationMessage !== undefined) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      if (editingPreset === undefined) {
        addPreset(amountMl);
      } else {
        updatePreset(editingPreset.id, amountMl);
      }

      resetDraft();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Preset could not be saved.');
    }
  };

  const startEditing = (preset: QuickAddPreset) => {
    setEditingPreset(preset);
    setDraftAmount(String(preset.amountMl));
    setErrorMessage(undefined);
  };

  const confirmRemovePreset = (preset: QuickAddPreset) => {
    Alert.alert('Remove quick add preset?', `${preset.amountMl} ml will leave Quick add.`, [
      { style: 'cancel', text: 'Keep it' },
      {
        onPress: () => {
          try {
            removePreset(preset.id);
            if (editingPreset?.id === preset.id) {
              resetDraft();
            }
          } catch (error) {
            setErrorMessage(
              error instanceof Error ? error.message : 'Preset could not be removed.',
            );
          }
        },
        style: 'destructive',
        text: 'Remove',
      },
    ]);
  };

  const canAddPreset = editingPreset !== undefined || presets.length < maxQuickAddPresetCount;

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
            Quick Add Presets
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
            Keep one-tap logging personal without slowing it down.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.editor,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <SectionHeader
          subtitle={`${minQuickAddPresetAmountMl}-${maxQuickAddPresetAmountMl} ml · up to ${maxQuickAddPresetCount} presets`}
          title={editingPreset === undefined ? 'Add preset' : 'Edit preset'}
        />
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Quick add preset amount"
            editable={canAddPreset}
            keyboardType="number-pad"
            onChangeText={(value) => {
              setDraftAmount(value.replace(/\D/g, ''));
              setErrorMessage(undefined);
            }}
            placeholder="Amount"
            placeholderTextColor={theme.app.colors.textSecondary}
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
            value={draftAmount}
          />
          <PrimaryButton
            accessibilityLabel={
              editingPreset === undefined ? 'Save quick add preset' : 'Save preset changes'
            }
            disabled={!canAddPreset}
            icon="check"
            label="Save"
            onPress={savePreset}
            style={styles.saveButton}
          />
        </View>
        {errorMessage === undefined ? null : (
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
            {errorMessage}
          </Text>
        )}
        {editingPreset === undefined ? null : (
          <SecondaryButton
            accessibilityLabel="Cancel editing quick add preset"
            label="Cancel edit"
            onPress={resetDraft}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          subtitle="The order here is the order shown on Home."
          title="Current presets"
        />
        {presets.map((preset, index) => (
          <View
            key={preset.id}
            style={[
              styles.presetRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
              },
            ]}
          >
            <View style={styles.presetCopy}>
              <Text
                style={[
                  styles.presetAmount,
                  {
                    color: theme.app.colors.textPrimary,
                    fontSize: theme.app.typography.fontSize.subtitle,
                    lineHeight: theme.app.typography.lineHeight.subtitle,
                  },
                ]}
              >
                {preset.amountMl} ml
              </Text>
              <Text
                style={[
                  styles.presetPosition,
                  {
                    color: theme.app.colors.textSecondary,
                    fontSize: theme.app.typography.fontSize.caption,
                    lineHeight: theme.app.typography.lineHeight.caption,
                  },
                ]}
              >
                Position {index + 1}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <IconButton
                accessibilityLabel={`Move ${preset.amountMl} milliliter preset earlier`}
                disabled={index === 0}
                icon="chevron-up"
                onPress={() => {
                  movePreset(preset.id, 'up');
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Move ${preset.amountMl} milliliter preset later`}
                disabled={index === presets.length - 1}
                icon="chevron-down"
                onPress={() => {
                  movePreset(preset.id, 'down');
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Edit ${preset.amountMl} milliliter preset`}
                icon="pencil-outline"
                onPress={() => {
                  startEditing(preset);
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Remove ${preset.amountMl} milliliter preset`}
                disabled={presets.length <= 1}
                icon="trash-can-outline"
                onPress={() => {
                  confirmRemovePreset(preset);
                }}
                size={20}
                style={styles.rowButton}
              />
            </View>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  editor: {
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  error: {},
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
  input: {
    borderWidth: 1,
    flex: 1,
    minHeight: 52,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetAmount: {
    fontWeight: '800',
  },
  presetCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  presetPosition: {},
  presetRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 14,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowButton: {
    height: 44,
    width: 44,
  },
  saveButton: {
    minHeight: 52,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 640,
    width: '100%',
  },
  section: {
    gap: 12,
  },
  subtitle: {},
  title: {
    fontWeight: '800',
  },
});
