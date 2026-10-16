import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { useAppSelector } from '@state/store/hooks';
import { premiumColors as colors } from './premium-style';

export function PremiumBanner() {
  const access = useAppSelector((state) => state.premium.access);
  const active = access.active;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'Manage Water Reminder Plus' : 'Explore Water Reminder Plus'}
      onPress={() => router.push(active ? '/premium-settings' : '/paywall')}
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.icon}>
        <Icon source="star-four-points" color={colors.gold} size={25} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>WATER REMINDER PLUS</Text>
        <Text style={styles.title}>
          {active ? 'Your Plus, your way.' : 'Make every sip yours.'}
        </Text>
        <Text style={styles.subtitle}>
          {active ? 'Explore your premium features' : 'Widgets, beautiful themes & more'}
        </Text>
      </View>
      <Icon source="arrow-right" color={colors.gold} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    backgroundColor: colors.raised,
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 5 },
  label: { color: colors.gold, fontSize: 9, letterSpacing: 1.6, fontWeight: '700' },
  title: { color: colors.text, fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
