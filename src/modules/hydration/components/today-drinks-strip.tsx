import { memo, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { IconButton, PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import { AnimatedPressableScale, EmptyState } from '@shared/motion';
import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';

import type { HydrationEntry } from '../types';
import { formatEntryTime } from '../utils/date';

const maxVisibleEntries = 12;

type TodayDrinksStripProps = {
  entries: readonly HydrationEntry[];
  measurementUnit: MeasurementUnit;
  onAddDefault: () => void;
  onDeleteEntry: (entry: HydrationEntry) => void;
  onEditEntry: (entry: HydrationEntry) => void;
  onOpenHistory: () => void;
  totalAmount: number;
};

export const TodayDrinksStrip = memo(function TodayDrinksStrip({
  entries,
  measurementUnit,
  onAddDefault,
  onDeleteEntry,
  onEditEntry,
  onOpenHistory,
  totalAmount,
}: TodayDrinksStripProps) {
  const theme = useTheme<AppTheme>();
  const visibleEntries = useMemo(
    () =>
      [...entries]
        .sort(
          (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
        )
        .slice(0, maxVisibleEntries),
    [entries],
  );

  if (entries.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader subtitle="Start with a quick add." title="Today" />
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.lg,
            },
          ]}
        >
          <EmptyState
            message="Start with a quick add."
            title="No drinks logged yet"
            variant="glass"
          />
          <PrimaryButton
            accessibilityLabel={`Add ${formatMeasurementAmount(250, measurementUnit)} of water`}
            icon="water"
            label={`Add ${formatMeasurementAmount(250, measurementUnit)}`}
            onPress={onAddDefault}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <SectionHeader
          subtitle={`${entries.length} ${
            entries.length === 1 ? 'entry' : 'entries'
          } · ${formatMeasurementAmount(totalAmount, measurementUnit)}`}
          title="Today"
        />
        <SecondaryButton
          accessibilityLabel="Open full hydration history"
          icon="history"
          label="View all"
          onPress={onOpenHistory}
          style={styles.viewAllButton}
        />
      </View>
      <FlatList
        accessibilityLabel="Today hydration entries"
        contentContainerStyle={styles.listContent}
        data={visibleEntries}
        horizontal
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <DrinkCard
            entry={item}
            measurementUnit={measurementUnit}
            onDeleteEntry={onDeleteEntry}
            onEditEntry={onEditEntry}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

function DrinkCard({
  entry,
  measurementUnit,
  onDeleteEntry,
  onEditEntry,
}: {
  entry: HydrationEntry;
  measurementUnit: MeasurementUnit;
  onDeleteEntry: (entry: HydrationEntry) => void;
  onEditEntry: (entry: HydrationEntry) => void;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
        },
      ]}
    >
      <AnimatedPressableScale
        accessibilityLabel={`${formatMeasurementAmount(entry.amount, measurementUnit)} at ${formatEntryTime(
          entry.timestamp,
        )}. Edit entry.`}
        accessibilityRole="button"
        onPress={() => {
          onEditEntry(entry);
        }}
        pressedScale={0.98}
        style={({ pressed }) => [styles.cardCopy, { opacity: pressed ? 0.78 : 1 }]}
      >
        <Text
          style={[
            styles.time,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {formatEntryTime(entry.timestamp)}
        </Text>
        <Text
          style={[
            styles.amount,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.subtitle,
              lineHeight: theme.app.typography.lineHeight.subtitle,
            },
          ]}
        >
          {formatMeasurementAmount(entry.amount, measurementUnit)}
        </Text>
      </AnimatedPressableScale>
      <View style={styles.actions}>
        <IconButton
          accessibilityLabel={`Edit ${entry.amount} milliliter entry`}
          icon="pencil-outline"
          onPress={() => {
            onEditEntry(entry);
          }}
          size={20}
          style={styles.smallIconButton}
        />
        <IconButton
          accessibilityLabel={`Delete ${entry.amount} milliliter entry`}
          icon="trash-can-outline"
          onPress={() => {
            onDeleteEntry(entry);
          }}
          size={20}
          style={styles.smallIconButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  amount: {
    fontWeight: '800',
  },
  card: {
    borderWidth: 1,
    gap: 8,
    marginRight: 10,
    minHeight: 126,
    padding: 14,
    width: 142,
  },
  cardCopy: {
    gap: 4,
    minHeight: 48,
  },
  emptyCard: {
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  listContent: {
    paddingRight: 4,
  },
  section: {
    gap: 14,
  },
  smallIconButton: {
    height: 44,
    width: 44,
  },
  time: {
    fontWeight: '700',
  },
  viewAllButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
