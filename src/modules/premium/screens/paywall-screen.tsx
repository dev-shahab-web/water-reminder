import { isPremiumThemeId } from '@shared/theme/premium-themes';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '@shared/components/themed-text';
import { Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { releaseLinks } from '@core/config';
import { premiumConfig, type PremiumPlanId } from '@core/config/premium-config';
import { useAppSelector } from '@state/store/hooks';

import { PremiumArtwork } from '../components/premium-artwork';
import { premiumColors as colors } from '../components/premium-style';
import {
  billingErrorMessage,
  isBillingConfigured,
  loadPremiumCatalog,
  purchasePremium,
  restorePremium,
} from '../services/premium-service';
import { formatPrice, getAnnualSaving, getBillingDisclosure, getPlanPrice } from '../utils/pricing';
import { openPremiumWebsite } from '../services/premium-promotions';

export function PaywallScreen() {
  const { previewTheme } = useLocalSearchParams<{ previewTheme?: string }>();
  const explorePlus = () =>
    router.replace(
      isPremiumThemeId(previewTheme)
        ? { pathname: '/premium-settings', params: { previewTheme } }
        : '/premium-settings',
    );
  const { fontScale, width } = useWindowDimensions();
  const compact = fontScale <= 1.2 && width < 600;
  const { products, status, access, pending } = useAppSelector((state) => state.premium);
  const [selection, setSelected] = useState<PremiumPlanId>(premiumConfig.defaultPlan);
  const selected =
    products.length && !products.some((product) => product.id === selection)
      ? products[0].id
      : selection;
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const operation = useRef(false);
  const active = access.active;
  const saving = getAnnualSaving(products);
  const selectedProduct = products.find((product) => product.id === selected);
  const canBuy = status === 'ready' && Boolean(selectedProduct) && !pending;
  const trialDays = selectedProduct?.freeTrialDays;

  useEffect(() => {
    void loadPremiumCatalog();
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const perform = async (action: 'purchase' | 'restore') => {
    if (operation.current) return;
    operation.current = true;
    setBusy(action);
    try {
      const result =
        action === 'purchase' ? await purchasePremium(selected) : await restorePremium();
      if (result.access.active) {
        Alert.alert(
          action === 'restore' ? 'Plus restored' : 'Welcome to Plus',
          'Your premium features are ready.',
          [{ text: 'Explore Plus', onPress: explorePlus }],
        );
      } else {
        Alert.alert(
          result.pending ? 'Payment pending' : 'No purchases found',
          result.pending
            ? 'Plus will unlock after Google Play confirms your payment. You can keep using the app.'
            : 'No active Plus plan was found for this Google Play account.',
        );
      }
    } catch (error) {
      if ((error as { code?: string })?.code !== 'USER_CANCELED')
        Alert.alert('Purchase update', billingErrorMessage(error));
    } finally {
      operation.current = false;
      setBusy(null);
    }
  };

  const openLegal = async (kind: 'terms' | 'privacy') => {
    const url = kind === 'terms' ? releaseLinks.termsUrl : releaseLinks.privacyPolicyUrl;
    if (!url) {
      Alert.alert(
        kind === 'terms' ? 'Purchase terms' : 'Privacy',
        kind === 'terms'
          ? 'Payment is charged to your Google Play account. Subscriptions renew automatically unless canceled in Google Play. One-time purchases have no recurring charge. Core hydration tracking remains free. Wear OS support is coming soon.'
          : 'Hydration records remain on your device. Google Play processes purchases. Hydration and payment details are never included in app analytics.',
      );
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link unavailable', 'Please try again later.');
    }
  };

  return (
    <SafeAreaView testID="premium-paywall" style={styles.screen}>
      <View style={styles.navigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
          onPress={close}
          style={styles.close}
        >
          <Icon source="close" color={colors.muted} size={23} />
        </Pressable>
        <Text style={styles.wordmark}>
          WATER REMINDER <Text style={styles.gold}>PLUS</Text>
        </Text>
        <View style={styles.close} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumArtwork compact={compact} />
        <View style={[styles.intro, compact && styles.compactIntro]}>
          <Text style={styles.eyebrow}>
            {active ? 'A LITTLE MORE YOU' : 'MAKE EVERY SIP YOURS'}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle]}>
            {active ? 'Welcome to Plus.' : 'A little more care.\nA lot more you.'}
          </Text>
          <Text style={styles.subtitle}>Your daily ritual, beautifully upgraded.</Text>
        </View>
        <View style={[styles.features, compact && styles.compactFeatures]}>
          {Object.entries(premiumConfig.features).map(([key, feature]) => (
            <View key={key} style={[styles.feature, compact && styles.compactFeature]}>
              <View style={styles.featureIcon}>
                <Icon source={feature.icon} size={21} color={colors.gold} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                {(!compact || !feature.available) && (
                  <Text style={styles.featureDescription}>
                    {feature.available ? feature.description : 'Coming soon'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
        {active ? (
          <View style={styles.memberCard}>
            <Icon source="check-decagram-outline" color={colors.mint} size={26} />
            <Text style={styles.memberText}>Your Plus plan is active. Make yourself at home.</Text>
          </View>
        ) : (
          <View style={styles.plans}>
            <Text style={styles.planHeading}>Choose your kind of Plus</Text>
            {premiumConfig.plans.map((plan) => {
              const price = getPlanPrice(plan.id, products);
              const chosen = selected === plan.id;
              const unavailable =
                products.length > 0 && !products.some((product) => product.id === plan.id);
              return (
                <Pressable
                  key={plan.id}
                  testID={`premium-plan-${plan.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: chosen, disabled: unavailable || busy !== null }}
                  accessibilityLabel={`${plan.title}, ${getBillingDisclosure(plan.id, products)}${unavailable ? ' Unavailable' : ''}`}
                  disabled={unavailable || busy !== null}
                  onPress={() => setSelected(plan.id)}
                  style={[
                    styles.plan,
                    chosen && styles.selectedPlan,
                    unavailable && styles.unavailable,
                  ]}
                >
                  <View style={[styles.radio, chosen && styles.selectedRadio]}>
                    {chosen && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.planCopy}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      {plan.id === 'yearly' && saving > 0 && (
                        <Text style={styles.badge}>SAVE {saving}%</Text>
                      )}
                    </View>
                    <Text style={styles.planDetail}>
                      {unavailable
                        ? 'Currently unavailable'
                        : price.freeTrialDays
                          ? `${price.freeTrialDays} days free, then ${price.formattedPrice} / ${plan.id === 'monthly' ? 'month' : 'year'}`
                          : plan.id === 'yearly'
                            ? `${formatPrice(price.price / 12, price.currency)} / month, billed yearly`
                            : plan.id === 'lifetime'
                              ? 'Yours to keep. Pay once.'
                              : 'A little more, month by month.'}
                    </Text>
                  </View>
                  <View style={styles.priceCopy}>
                    <Text style={styles.price}>{price.formattedPrice}</Text>
                    <Text style={styles.pricePeriod}>
                      {plan.id === 'monthly' ? '/ month' : plan.id === 'yearly' ? '/ year' : 'once'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            {pending && (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                Your payment is pending approval in Google Play.
              </Text>
            )}
            {status === 'loading' && (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                Getting your local prices from Google Play…
              </Text>
            )}
            {status !== 'loading' && products.length === 0 && (
              <Text style={styles.notice}>
                {isBillingConfigured()
                  ? 'Google Play prices are unavailable. Please try again.'
                  : 'Preview prices · purchases coming soon.'}
              </Text>
            )}
            {status !== 'loading' && products.length === 0 && isBillingConfigured() && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadPremiumCatalog()}
                style={styles.linkButton}
              >
                <Text style={styles.link}>Try again</Text>
              </Pressable>
            )}
          </View>
        )}
        <Text style={styles.freeNote}>Your everyday hydration essentials stay free.</Text>
        <Pressable
          testID="premium-website"
          accessibilityRole="link"
          onPress={() => {
            void openPremiumWebsite('paywall');
          }}
          style={styles.linkButton}
        >
          <Text style={styles.link}>App news & offers at Lumarc Studio ↗</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          testID="premium-continue"
          accessibilityRole="button"
          accessibilityLabel={
            active
              ? 'Explore premium features'
              : trialDays
                ? `Start ${trialDays}-day free trial. ${getBillingDisclosure(selected, products)}`
                : `Continue with ${selected === 'lifetime' ? 'one-time purchase' : selected} plan`
          }
          accessibilityState={{
            disabled: !active && (!canBuy || busy !== null),
            busy: busy === 'purchase',
          }}
          disabled={!active && (!canBuy || busy !== null)}
          onPress={() => (active ? explorePlus() : void perform('purchase'))}
          style={({ pressed }) => [
            styles.cta,
            !active && (!canBuy || busy !== null) && styles.disabledCta,
            pressed && styles.pressed,
          ]}
        >
          {busy === 'purchase' ? (
            <ActivityIndicator color={colors.goldText} />
          ) : (
            <>
              <Text style={styles.ctaText}>
                {active
                  ? 'Explore Plus'
                  : trialDays
                    ? `Start ${trialDays}-day free trial`
                    : `Get ${selected === 'lifetime' ? 'lifetime' : selected} Plus`}
              </Text>
              <Icon source="arrow-right" color={colors.goldText} size={21} />
            </>
          )}
        </Pressable>
        {!active && (
          <Text style={styles.disclosure}>{getBillingDisclosure(selected, products)}</Text>
        )}
        <View style={styles.links}>
          <Pressable
            accessibilityRole="button"
            disabled={busy !== null || !isBillingConfigured()}
            accessibilityState={{ disabled: busy !== null || !isBillingConfigured() }}
            onPress={() => void perform('restore')}
            style={styles.linkButton}
          >
            <Text style={[styles.link, !isBillingConfigured() && styles.unavailable]}>
              {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void openLegal('terms')}
            style={styles.linkButton}
          >
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void openLegal('privacy')}
            style={styles.linkButton}
          >
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  wordmark: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
    flexShrink: 1,
    textAlign: 'center',
  },
  gold: { color: colors.gold },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  intro: { alignItems: 'center', gap: 10, marginBottom: 26 },
  compactIntro: { gap: 8, marginBottom: 20 },
  compactTitle: { fontSize: 30, lineHeight: 35 },
  compactFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 22 },
  compactFeature: { width: '47%', gap: 9 },
  eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  title: {
    color: colors.text,
    fontSize: 33,
    lineHeight: 39,
    letterSpacing: -0.9,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  features: { gap: 18, marginBottom: 28 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  featureDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  plans: { gap: 10 },
  planHeading: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 78,
  },
  selectedPlan: { borderColor: colors.gold, backgroundColor: colors.selected },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: colors.muted,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: { borderColor: colors.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  planCopy: { flex: 1, gap: 5 },
  planTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  planTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  badge: {
    color: colors.goldText,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    overflow: 'hidden',
    fontSize: 9,
    fontWeight: '800',
  },
  planDetail: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  priceCopy: { alignItems: 'flex-end', maxWidth: '40%', gap: 3 },
  price: { color: colors.text, fontSize: 18, fontWeight: '700' },
  pricePeriod: { color: colors.muted, fontSize: 11 },
  freeNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 18,
  },
  notice: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  cta: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  ctaText: { color: colors.goldText, fontSize: 16, fontWeight: '800' },
  disabledCta: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  disclosure: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    paddingTop: 10,
  },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: 20 },
  linkButton: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.muted, fontSize: 11, textAlign: 'center', textDecorationLine: 'underline' },
  unavailable: { opacity: 0.5 },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: { color: colors.text, flex: 1, lineHeight: 22 },
});
