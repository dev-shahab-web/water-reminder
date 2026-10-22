/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';
import { Text as NativeText } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { store } from '@state/store/store';
import { catalogReceived, preferencesChanged } from '@modules/premium/state/premium-slice';
import { changePremiumTheme } from '@modules/premium/services/premium-service';
import {
  readPremiumPreferences,
  persistPremiumPreferences,
} from '@modules/premium/storage/premium-preferences';
import { Text } from '@shared/components/themed-text';
import type { AppTheme } from '@shared/theme';
import { AppProviders } from './app-providers';

let mockFontsReady = true;
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));
jest.mock('expo-font', () => ({
  ...jest.requireActual<typeof import('expo-font')>('expo-font'),
  useFonts: () => [mockFontsReady, null],
  isLoaded: () => true,
}));
jest.mock('@modules/widgets', () => ({ WidgetLiveSync: () => null }));
jest.mock('@modules/premium/components/premium-runtime', () => ({ PremiumRuntime: () => null }));
jest.mock('@modules/wear/components/wear-runtime', () => ({ WearRuntime: () => null }));
jest.mock('@modules/settings/storage/settings-storage', () => {
  const settings = { themePreference: 'light', reduceMotion: true };
  return { getSettingsState: () => settings, subscribeToSettings: () => () => undefined };
});
jest.mock('@platform/storage', () => {
  const values = new Map<string, unknown>();
  return {
    getStorage: () => ({
      getString: (key: string) => values.get(key),
      getBoolean: (key: string) => values.get(key),
      set: (key: string, value: unknown) => values.set(key, value),
    }),
  };
});
jest.mock('@state/store/store', () => {
  const { configureStore } =
    jest.requireActual<typeof import('@reduxjs/toolkit')>('@reduxjs/toolkit');
  const { premiumReducer } = jest.requireActual<
    typeof import('@modules/premium/state/premium-slice')
  >('@modules/premium/state/premium-slice');
  return { store: configureStore({ reducer: { premium: premiumReducer } }) };
});

function ThemeProbe() {
  const theme = useTheme<AppTheme>();
  return (
    <>
      <NativeText testID="theme-id">{theme.app.presentation.id}</NativeText>
      <NativeText testID="icon-style">{theme.app.presentation.iconStyle}</NativeText>
      <Icon source="cog-outline" size={24} testID="paper-themed-icon" />
      <Text
        testID="themed-heading"
        accessibilityRole="header"
        style={{ fontSize: 28, fontWeight: '700' }}
      >
        Your daily ritual
      </Text>
    </>
  );
}

const grant = (milliseconds: number) =>
  store.dispatch(
    catalogReceived({
      access: { active: true, accessUntil: Date.now() + milliseconds, productIds: ['plus'] },
      products: [],
      pending: false,
    }),
  );

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-18T00:00:00Z'));
  mockFontsReady = true;
  store.dispatch(
    catalogReceived({
      access: { active: false, accessUntil: 0, productIds: [] },
      products: [],
      pending: false,
    }),
  );
  const preferences = { theme: 'default', icon: 'default', dailyOffers: false } as const;
  persistPremiumPreferences(preferences);
  store.dispatch(preferencesChanged(preferences));
});
afterEach(() => {
  jest.useRealTimers();
});

describe('verified theme application', () => {
  it('blocks paid styles for free users while keeping Ocean available', () => {
    render(
      <AppProviders>
        <ThemeProbe />
      </AppProviders>,
    );
    expect(() => changePremiumTheme('expressive')).toThrow('Premium is required.');
    expect(readPremiumPreferences().theme).toBe('default');
    expect(screen.getByTestId('theme-id')).toHaveTextContent('default');
    act(() => changePremiumTheme('default'));
    expect(() => changePremiumTheme('unknown' as 'default')).toThrow('Unknown theme.');
  });

  it('applies and persists a verified theme, falls back at expiry, then restores the preference', () => {
    const view = render(
      <AppProviders>
        <ThemeProbe />
      </AppProviders>,
    );
    act(() => {
      grant(1_000);
      changePremiumTheme('expressive');
    });
    expect(screen.getByTestId('theme-id')).toHaveTextContent('expressive');
    expect(screen.getByTestId('icon-style')).toHaveTextContent('material');
    expect(screen.getByTestId('themed-heading')).toHaveStyle({
      fontFamily: 'WR-Sans-Bold',
      fontWeight: 'normal',
    });
    expect(readPremiumPreferences().theme).toBe('expressive');
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.getByTestId('theme-id')).toHaveTextContent('default');
    expect(readPremiumPreferences().theme).toBe('expressive');
    expect(() => changePremiumTheme('rose')).toThrow('Premium is required.');
    act(() => grant(60_000));
    expect(screen.getByTestId('theme-id')).toHaveTextContent('expressive');
    view.unmount();
    render(
      <AppProviders>
        <ThemeProbe />
      </AppProviders>,
    );
    expect(screen.getByTestId('theme-id')).toHaveTextContent('expressive');
  });

  it('renders a paid palette safely while fonts load, then uses its bundled typography', () => {
    mockFontsReady = false;
    grant(60_000);
    changePremiumTheme('rose');
    const view = render(
      <AppProviders>
        <ThemeProbe />
      </AppProviders>,
    );
    expect(screen.getByTestId('theme-id')).toHaveTextContent('rose');
    expect(screen.getByTestId('themed-heading')).not.toHaveStyle({ fontFamily: 'WR-Serif-Bold' });
    mockFontsReady = true;
    view.rerender(
      <AppProviders>
        <ThemeProbe />
      </AppProviders>,
    );
    expect(screen.getByTestId('themed-heading')).toHaveStyle({ fontFamily: 'WR-Serif-Bold' });
  });
});
