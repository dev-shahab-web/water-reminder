import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, PaperProvider, useTheme } from 'react-native-paper';

import { PrimaryButton } from '@shared/components/primary-button';
import { PaperMaterialCommunityIcon } from '@shared/components/material-community-icon';
import { Text } from '@shared/components/themed-text';
import { appDarkTheme, appLightTheme, type AppTheme } from '@shared/theme';
import {
  applyPremiumTheme,
  premiumThemes,
  type PremiumThemeId,
} from '@shared/theme/premium-themes';

type ThemeStudioProps = {
  active: boolean;
  applied: PremiumThemeId;
  onApply: (id: PremiumThemeId) => void;
  onUnlock: (id: PremiumThemeId) => void;
  initialSelection?: PremiumThemeId;
};

const iconSettings = { icon: PaperMaterialCommunityIcon };

export function ThemeStudio({
  active,
  applied,
  onApply,
  onUnlock,
  initialSelection,
}: ThemeStudioProps) {
  const theme = useTheme<AppTheme>();
  const [selected, setSelected] = useState<PremiumThemeId>(initialSelection ?? applied);
  const [dark, setDark] = useState(theme.dark);
  const preset = premiumThemes.find((item) => item.id === selected)!;
  const preview = useMemo(
    () =>
      applyPremiumTheme(
        dark ? appDarkTheme : appLightTheme,
        selected,
        theme.app.presentation.fontsReady,
      ),
    [dark, selected, theme.app.presentation.fontsReady],
  );
  const locked = selected !== 'default' && !active;

  return (
    <View style={styles.studio}>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Theme previews">
        {premiumThemes.map((item) => (
          <Pressable
            key={item.id}
            testID={`premium-theme-${item.id}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === item.id }}
            accessibilityLabel={`Preview ${item.name} theme${item.id === applied ? ', applied' : ''}`}
            onPress={() => setSelected(item.id)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor:
                  selected === item.id ? theme.colors.secondaryContainer : theme.colors.surface,
                borderColor:
                  selected === item.id ? theme.colors.primary : theme.app.colors.borderSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.motif, { backgroundColor: item.tint }]}>
                <Icon source={item.motif} color={item.light} size={22} />
              </View>
              <Icon
                source={
                  selected === item.id
                    ? 'check-circle'
                    : item.id === 'default' || active
                      ? 'circle-outline'
                      : 'lock-outline'
                }
                size={18}
                color={selected === item.id ? theme.colors.primary : theme.app.colors.textSecondary}
              />
            </View>
            <Text style={[styles.optionName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}>
              {item.id === applied ? 'Applied' : item.id === 'default' ? 'Included' : 'Plus'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.previewHeader}>
        <Text accessibilityRole="header" style={[styles.label, { color: theme.colors.onSurface }]}>
          Live preview
        </Text>
        <View
          style={[styles.modeSwitch, { backgroundColor: theme.colors.surfaceVariant }]}
          accessibilityRole="radiogroup"
          accessibilityLabel="Preview appearance"
        >
          {[false, true].map((value) => (
            <Pressable
              key={String(value)}
              accessibilityRole="radio"
              accessibilityLabel={`${value ? 'Dark' : 'Light'} theme preview`}
              accessibilityState={{ checked: dark === value }}
              onPress={() => setDark(value)}
              style={[
                styles.mode,
                {
                  backgroundColor: dark === value ? theme.colors.secondaryContainer : 'transparent',
                },
              ]}
            >
              <Icon
                source={value ? 'weather-night' : 'white-balance-sunny'}
                size={17}
                color={
                  dark === value ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.caption,
                  {
                    color:
                      dark === value
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {value ? 'Dark' : 'Light'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <PaperProvider theme={preview} settings={iconSettings}>
        <ThemePreview name={preset.name} description={preset.description} />
      </PaperProvider>
      <View style={styles.details}>
        <View style={styles.detail}>
          <Icon source="format-font" size={18} color={theme.colors.primary} />
          <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {preset.fontName}
          </Text>
        </View>
        <View style={styles.detail}>
          <Icon source="shape-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            {preset.iconLabel}
          </Text>
        </View>
      </View>
      <PrimaryButton
        testID="apply-premium-theme"
        icon={locked ? 'lock-open-outline' : selected === applied ? 'check' : 'palette-outline'}
        label={
          locked
            ? `Unlock ${preset.name}`
            : selected === applied
              ? `${preset.name} is applied`
              : `Apply ${preset.name}`
        }
        disabled={!locked && selected === applied}
        onPress={() => (locked ? onUnlock(selected) : onApply(selected))}
      />
      <Text style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
        Preview freely. Apply a theme to change colors, type and icons throughout the app. Your
        light or dark preference stays the same.
      </Text>
    </View>
  );
}

function ThemePreview({ name, description }: { name: string; description: string }) {
  const theme = useTheme<AppTheme>();
  return (
    <View
      testID="theme-live-preview"
      style={[
        styles.preview,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.outlineVariant,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <View style={styles.previewTop}>
        <View style={styles.previewTitle}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>YOUR DAILY RITUAL</Text>
          <Text
            accessibilityRole="header"
            style={[styles.previewName, { color: theme.colors.onSurface }]}
          >
            {name}
          </Text>
        </View>
        <View style={[styles.palette, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Icon source="water" size={30} color={theme.colors.onTertiaryContainer} />
        </View>
      </View>
      <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        {description}
      </Text>
      <View
        style={[
          styles.sampleCard,
          { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.app.radius.md },
        ]}
      >
        <Text style={[styles.caption, { color: theme.colors.onPrimaryContainer }]}>
          A little closer to your goal
        </Text>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: theme.colors.onPrimaryContainer }]}>1,250</Text>
          <Text style={[styles.caption, { color: theme.colors.onPrimaryContainer }]}>
            / 2,000 mL
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.fill, { backgroundColor: theme.colors.primary }]} />
        </View>
      </View>
      <View style={styles.sampleFooter}>
        <View
          style={[
            styles.sampleButton,
            { backgroundColor: theme.colors.primary, borderRadius: theme.app.radius.md },
          ]}
        >
          <Icon source="plus" size={20} color={theme.colors.onPrimary} />
          <Text style={[styles.label, { color: theme.colors.onPrimary }]}>Add water</Text>
        </View>
        {['history', 'bell-outline', 'cog-outline'].map((icon) => (
          <Icon key={icon} source={icon} size={22} color={theme.colors.secondary} />
        ))}
      </View>
      <View style={styles.swatches} accessibilityLabel="Theme palette">
        {[
          theme.colors.primary,
          theme.colors.secondary,
          theme.colors.tertiary,
          theme.colors.primaryContainer,
          theme.colors.secondaryContainer,
        ].map((color, index) => (
          <View key={index} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  studio: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    flexBasis: '45%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  motif: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700' },
  previewHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeSwitch: { flexDirection: 'row', padding: 4, borderRadius: 24 },
  mode: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    minHeight: 40,
    alignItems: 'center',
    borderRadius: 20,
  },
  preview: { padding: 18, gap: 14, borderWidth: 1, overflow: 'hidden' },
  previewTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  previewTitle: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  previewName: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  palette: {
    width: 50,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  description: { fontSize: 13, lineHeight: 19 },
  sampleCard: { padding: 16, gap: 6 },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 },
  amount: { fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 8, overflow: 'hidden', marginTop: 8 },
  fill: { width: '62.5%', height: '100%', borderRadius: 8 },
  sampleFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    flexGrow: 1,
  },
  swatches: { flexDirection: 'row', gap: 6 },
  swatch: { height: 10, borderRadius: 8, flex: 1 },
  details: { gap: 8 },
  detail: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  detailText: { fontSize: 13, flex: 1 },
  note: { fontSize: 12, lineHeight: 18 },
});
