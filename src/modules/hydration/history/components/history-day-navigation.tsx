import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { SecondaryButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { formatHistoryDate, isToday } from '../../utils/date';

type HistoryDayNavigationProps = {
  isFutureNextDay: boolean;
  onNextDay: () => void;
  onPreviousDay: () => void;
  onToday: () => void;
  selectedDate: Date;
};

export function HistoryDayNavigation({
  isFutureNextDay,
  onNextDay,
  onPreviousDay,
  onToday,
  selectedDate,
}: HistoryDayNavigationProps) {
  const theme = useTheme<AppTheme>();
  const selectedIsToday = isToday(selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.dateCopy}>
        <Text
          accessibilityRole="header"
          style={[
            styles.date,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.title,
              lineHeight: theme.app.typography.lineHeight.title,
            },
          ]}
        >
          {formatHistoryDate(selectedDate)}
        </Text>
        <Text
          style={[
            styles.status,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {selectedIsToday ? 'Selected day is today.' : 'Reviewing a previous day.'}
        </Text>
      </View>
      <View style={styles.actions}>
        <SecondaryButton label="Previous" onPress={onPreviousDay} style={styles.action} />
        <SecondaryButton
          disabled={isFutureNextDay}
          label="Next"
          onPress={onNextDay}
          style={styles.action}
        />
        <SecondaryButton
          disabled={selectedIsToday}
          label="Today"
          onPress={onToday}
          style={styles.action}
        />
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
  container: {
    gap: 14,
  },
  date: {
    fontWeight: '800',
  },
  dateCopy: {
    gap: 4,
  },
  status: {},
});
