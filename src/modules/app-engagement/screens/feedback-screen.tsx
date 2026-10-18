import { useState, useSyncExternalStore } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { router } from 'expo-router';
import { Icon, useTheme } from 'react-native-paper';
import { AppScreen, IconButton, PrimaryButton, SecondaryButton } from '@shared/components';
import type { AppTheme } from '@shared/theme';
import {
  getEngagementSnapshot,
  openStoreReview,
  respondToReview,
  subscribeEngagement,
} from '../services/engagement-service';

export function FeedbackScreen() {
  const theme = useTheme<AppTheme>();
  const { preferences } = useSyncExternalStore(
    subscribeEngagement,
    getEngagementSnapshot,
    getEngagementSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const respond = async (response: 'reviewed' | 'never' | 'later' | 'open') => {
    setBusy(true);
    try {
      if (response === 'open') {
        await openStoreReview();
        setMessage(
          'Thank you for taking a look. If you left a review, tap “I’ve already reviewed” below to stop reminders.',
        );
      } else {
        await respondToReview(response);
        if (response === 'later') back();
        else
          setMessage(
            response === 'reviewed'
              ? 'Thank you. Review reminders are now off.'
              : 'Review reminders are now off.',
          );
      }
    } catch {
      Alert.alert('Could not complete request', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppScreen scrollable>
      <IconButton accessibilityLabel="Go back" icon="back" onPress={back} />
      <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source="message-star-outline" size={56} color={theme.colors.primary} />
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.app.colors.textPrimary }]}
      >
        Help shape Water Reminder
      </Text>
      <Text style={[styles.copy, { color: theme.app.colors.textSecondary }]}>
        Share an honest review on Google Play. What works well, and what could feel better? Your
        feedback helps us improve.
      </Text>
      {message !== '' && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.copy, { color: theme.colors.primary }]}
        >
          {message}
        </Text>
      )}
      <PrimaryButton
        testID="review-open-store"
        disabled={busy}
        label="Review on Google Play"
        icon="google-play"
        onPress={() => {
          void respond('open');
        }}
      />
      <SecondaryButton
        testID="review-already-done"
        disabled={busy}
        label="I’ve already reviewed"
        icon="check"
        onPress={() => {
          void respond('reviewed');
        }}
      />
      <SecondaryButton
        testID="review-never"
        disabled={busy || preferences?.reviewRemindersEnabled === false}
        label="Don’t remind me"
        onPress={() => {
          void respond('never');
        }}
      />
      <SecondaryButton
        disabled={busy}
        label="Maybe later"
        onPress={() => {
          void respond('later');
        }}
      />
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  hero: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  copy: { fontSize: 16, lineHeight: 25 },
});
