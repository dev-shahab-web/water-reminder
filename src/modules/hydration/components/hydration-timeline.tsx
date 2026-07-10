import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import { SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import type { HydrationEntry } from '../types';
import { formatEntryTime } from '../utils/date';

type HydrationTimelineProps = {
  entries: readonly HydrationEntry[];
  onDeleteEntry: (entry: HydrationEntry) => void;
  onEditEntry: (entry: HydrationEntry) => void;
};

export const HydrationTimeline = memo(function HydrationTimeline({
  entries,
  onDeleteEntry,
  onEditEntry,
}: HydrationTimelineProps) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const entering = reduceMotion
    ? undefined
    : FadeInDown.duration(180).easing(Easing.out(Easing.cubic));
  const exiting = reduceMotion
    ? undefined
    : FadeOutUp.duration(140).easing(Easing.out(Easing.cubic));

  if (entries.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader
          subtitle="Add your first drink to start today's progress."
          title="No water logged yet today."
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader subtitle="Recent entries from today." title="Today's timeline" />
      <View style={styles.list}>
        {entries.map((entry) => (
          <Animated.View
            key={entry.id}
            entering={entering}
            exiting={exiting}
            style={[
              styles.item,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
              },
            ]}
          >
            <View style={styles.itemCopy}>
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
            </View>
            <View style={styles.itemActions}>
              <SecondaryButton
                accessibilityLabel={`Edit ${entry.amount} milliliter entry`}
                label="Edit"
                onPress={() => {
                  onEditEntry(entry);
                }}
                style={styles.smallButton}
              />
              <SecondaryButton
                accessibilityLabel={`Delete ${entry.amount} milliliter entry`}
                label="Delete"
                onPress={() => {
                  onDeleteEntry(entry);
                }}
                style={styles.smallButton}
              />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
  },
  item: {
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemCopy: {
    gap: 2,
  },
  list: {
    gap: 10,
  },
  section: {
    gap: 14,
  },
  smallButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  time: {},
});
