import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import type { HydrationEntry } from '../../types';
import { formatEntryTime } from '../../utils/date';

type HistoryEntryListProps = {
  entries: readonly HydrationEntry[];
  onDeleteEntry: (entry: HydrationEntry) => void;
  onEditEntry: (entry: HydrationEntry) => void;
};

const sourceLabels: Record<HydrationEntry['source'], string> = {
  custom: 'Custom amount',
  edit: 'Edited',
  quick_add: 'Quick add',
};

export function HistoryEntryList({ entries, onDeleteEntry, onEditEntry }: HistoryEntryListProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.section}>
      <SectionHeader subtitle={`${entries.length} entries for this day.`} title="Entries" />
      <View style={styles.list}>
        {entries.map((entry) => (
          <View
            key={entry.id}
            style={[
              styles.item,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
              },
            ]}
          >
            <View style={styles.copy}>
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
                {entry.amount} ml
              </Text>
              <Text
                style={[
                  styles.meta,
                  {
                    color: theme.app.colors.textSecondary,
                    fontSize: theme.app.typography.fontSize.caption,
                    lineHeight: theme.app.typography.lineHeight.caption,
                  },
                ]}
              >
                {formatEntryTime(entry.timestamp)} · {sourceLabels[entry.source]}
              </Text>
            </View>
            <View style={styles.actions}>
              <SecondaryButton
                accessibilityLabel={`Edit ${entry.amount} milliliter entry`}
                label="Edit"
                onPress={() => {
                  onEditEntry(entry);
                }}
                style={styles.action}
              />
              <SecondaryButton
                accessibilityLabel={`Delete ${entry.amount} milliliter entry`}
                label="Delete"
                onPress={() => {
                  onDeleteEntry(entry);
                }}
                style={styles.action}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flexBasis: 96,
    flexGrow: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amount: {
    fontWeight: '800',
  },
  copy: {
    gap: 3,
  },
  item: {
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  list: {
    gap: 10,
  },
  meta: {},
  section: {
    gap: 14,
  },
});
