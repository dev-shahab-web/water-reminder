import { GlassSurface } from '@shared/components/glass-surface';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from 'react-native-paper';

import {
  AppScreen,
  IconButton,
  MaterialCommunityIcon,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import type { AppTheme } from '@shared/theme';
import { useSettingsSnapshot, type MeasurementUnit } from '@modules/settings';
import { SegmentedSetting } from '@modules/settings/components/segmented-setting';
import { AnimatedPressableScale } from '@shared/motion';
import {
  formatMeasurementAmount,
  getMeasurementValue,
  ouncesToMilliliters,
} from '@modules/settings/utils/settings-options';

import type { QuickAddPreset } from '../types';
import { GlassIllustration } from '../components/glass-illustration';
import {
  maxQuickAddPresetAmountMl,
  maxQuickAddPresetCount,
  minQuickAddPresetAmountMl,
  validateQuickAddPresetAmount,
} from '../utils/quick-add-presets';
import { useQuickAddPresets } from '../hooks/use-quick-add-presets';
import {
  alternateGlassCapacity,
  formatGlassCapacity,
  getGlassOptions,
} from '../utils/glass-options';

export function QuickAddPresetsScreen() {
  const theme = useTheme<AppTheme>();
  const settings = useSettingsSnapshot();
  const [capacityUnit, setCapacityUnit] = useState<MeasurementUnit>(settings.measurementUnit);
  const { addPreset, makeDefaultPreset, movePreset, presets, removePreset, updatePreset } =
    useQuickAddPresets();
  const [draftAmount, setDraftAmount] = useState('');
  const [editingPreset, setEditingPreset] = useState<QuickAddPreset | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const resetDraft = () => {
    setDraftAmount('');
    setEditingPreset(undefined);
    setErrorMessage(undefined);
  };

  const savePreset = () => {
    const parsedAmount = Number.parseFloat(draftAmount);
    const amountMl =
      capacityUnit === 'oz' ? ouncesToMilliliters(parsedAmount) : Math.round(parsedAmount);
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
    setDraftAmount(String(getMeasurementValue(preset.amountMl, capacityUnit)));
    setErrorMessage(undefined);
  };

  const confirmRemovePreset = (preset: QuickAddPreset) => {
    Alert.alert(
      'Remove quick add preset?',
      `${formatMeasurementAmount(preset.amountMl, capacityUnit)} will leave Quick add.`,
      [
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
      ],
    );
  };

  const canAddPreset = editingPreset !== undefined || presets.length < maxQuickAddPresetCount;

  const changeCapacityUnit = (unit: MeasurementUnit) => {
    if (unit === capacityUnit) return;
    const amount = Number(draftAmount);
    if (draftAmount !== '' && Number.isFinite(amount)) {
      const amountMl = capacityUnit === 'oz' ? ouncesToMilliliters(amount) : amount;
      setDraftAmount(String(getMeasurementValue(amountMl, unit)));
    }
    setCapacityUnit(unit);
    setErrorMessage(undefined);
  };

  const toggleGlass = (amountMl: number) => {
    const selected = presets.find((preset) => preset.amountMl === amountMl);
    try {
      if (selected) {
        removePreset(selected.id);
        if (editingPreset?.id === selected.id) resetDraft();
      } else {
        addPreset(amountMl);
      }
      setErrorMessage(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Glass could not be saved.');
    }
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
            My glasses
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
            Choose your glass capacities for one-tap water logging.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Choose glass sizes"
          subtitle={`Select up to ${maxQuickAddPresetCount} glasses. Selected sizes appear on Home. Oz uses US fluid ounces.`}
        />
        <SegmentedSetting
          accessibilityLabel="Glass capacity unit"
          onChange={changeCapacityUnit}
          options={[
            { label: 'mL', value: 'ml' },
            { label: 'oz', value: 'oz' },
          ]}
          value={capacityUnit}
        />
        <View style={styles.glassGrid}>
          {getGlassOptions(capacityUnit).map((glass) => {
            const selected = presets.some((preset) => preset.amountMl === glass.amountMl);
            const disabled = selected
              ? presets.length === 1
              : presets.length >= maxQuickAddPresetCount;
            return (
              <View key={glass.amountMl} style={styles.glassCell}>
                <AnimatedPressableScale
                  glass="regular"
                  selected={selected}
                  accessibilityLabel={`${glass.label} glass, ${alternateGlassCapacity(glass.amountMl, capacityUnit)}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled }}
                  disabled={disabled}
                  onPress={() => toggleGlass(glass.amountMl)}
                  style={[
                    styles.glassOption,
                    {
                      borderRadius: theme.app.radius.md,
                      opacity: disabled && !selected ? 0.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.selectionMark}>
                    <MaterialCommunityIcon
                      name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      color={theme.colors.primary}
                      size={18}
                    />
                  </View>
                  <GlassIllustration amountMl={glass.amountMl} />
                  <Text style={[styles.presetAmount, { color: theme.app.colors.textPrimary }]}>
                    {glass.label}
                  </Text>
                  <Text style={{ color: theme.app.colors.textSecondary }}>
                    ≈ {alternateGlassCapacity(glass.amountMl, capacityUnit)}
                  </Text>
                </AnimatedPressableScale>
              </View>
            );
          })}
        </View>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.app.colors.textSecondary }}>
          {presets.length} of {maxQuickAddPresetCount} glasses selected. Keep at least one glass.
        </Text>
      </View>

      <GlassSurface
        style={[
          styles.editor,
          {
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <SectionHeader
          subtitle={`${formatMeasurementAmount(
            minQuickAddPresetAmountMl,
            capacityUnit,
          )}-${formatMeasurementAmount(
            maxQuickAddPresetAmountMl,
            capacityUnit,
          )} · enter the capacity in ${capacityUnit === 'ml' ? 'mL' : 'oz'}`}
          title={editingPreset === undefined ? 'Custom glass' : 'Edit glass'}
        />
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel={`Glass capacity in ${capacityUnit}`}
            editable={canAddPreset}
            keyboardType={capacityUnit === 'oz' ? 'decimal-pad' : 'number-pad'}
            onChangeText={(value) => {
              setDraftAmount(
                capacityUnit === 'oz'
                  ? value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
                  : value.replace(/\D/g, ''),
              );
              setErrorMessage(undefined);
            }}
            placeholder={`Capacity (${capacityUnit === 'ml' ? 'mL' : 'oz'})`}
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
      </GlassSurface>

      <View style={styles.section}>
        <SectionHeader
          subtitle="Your first glass is the default for notifications. The same order appears on Home."
          title="Selected glasses"
        />
        {presets.map((preset, index) => (
          <GlassSurface
            key={preset.id}
            style={[
              styles.presetRow,
              {
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
                {formatGlassCapacity(preset.amountMl, capacityUnit)}
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
                ≈ {alternateGlassCapacity(preset.amountMl, capacityUnit)} ·{' '}
                {index === 0 ? 'Notification default' : `Position ${index + 1}`}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <IconButton
                accessibilityLabel={
                  index === 0
                    ? `${formatGlassCapacity(preset.amountMl, capacityUnit)} is the notification default`
                    : `Use ${formatGlassCapacity(preset.amountMl, capacityUnit)} for notifications`
                }
                disabled={index === 0}
                icon={index === 0 ? 'star' : 'star-outline'}
                onPress={() => makeDefaultPreset(preset.id)}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Move ${formatMeasurementAmount(
                  preset.amountMl,
                  capacityUnit,
                )} preset earlier`}
                disabled={index === 0}
                icon="chevron-up"
                onPress={() => {
                  movePreset(preset.id, 'up');
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Move ${formatMeasurementAmount(
                  preset.amountMl,
                  capacityUnit,
                )} preset later`}
                disabled={index === presets.length - 1}
                icon="chevron-down"
                onPress={() => {
                  movePreset(preset.id, 'down');
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Edit ${formatMeasurementAmount(
                  preset.amountMl,
                  capacityUnit,
                )} preset`}
                icon="pencil-outline"
                onPress={() => {
                  startEditing(preset);
                }}
                size={20}
                style={styles.rowButton}
              />
              <IconButton
                accessibilityLabel={`Remove ${formatMeasurementAmount(
                  preset.amountMl,
                  capacityUnit,
                )} preset`}
                disabled={presets.length <= 1}
                icon="trash-can-outline"
                onPress={() => {
                  confirmRemovePreset(preset);
                }}
                size={20}
                style={styles.rowButton}
              />
            </View>
          </GlassSurface>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  glassGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  glassCell: { flexBasis: '30%', flexGrow: 1, minWidth: 96 },
  selectionMark: { position: 'absolute', top: 8, right: 8 },
  glassOption: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 6,
    paddingTop: 20,
    paddingBottom: 12,
  },
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
