import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { PremiumCatalog } from '../types';
import { PaywallScreen } from './paywall-screen';

const mockLoad = jest.fn<() => Promise<void>>();
const mockPurchase = jest.fn<() => Promise<PremiumCatalog>>();
let mockConfigured = false;
let mockState: { premium: PremiumCatalog & { status: string } };

jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn() },
}));
jest.mock('react-native-paper', () => ({ Icon: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
}));
jest.mock('../components/premium-artwork', () => ({ PremiumArtwork: () => null }));
jest.mock('@state/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock('../services/premium-service', () => ({
  isBillingConfigured: () => mockConfigured,
  loadPremiumCatalog: () => mockLoad(),
  purchasePremium: (...args: []) => mockPurchase(...args),
  restorePremium: jest.fn(),
  billingErrorMessage: () => 'Purchase unavailable',
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockConfigured = false;
  mockLoad.mockResolvedValue(undefined);
  mockState = {
    premium: {
      products: [],
      access: { active: false, accessUntil: 0, productIds: [] },
      pending: false,
      status: 'unavailable',
    },
  };
});

describe('paywall interactions', () => {
  it('lets users compare all plans in preview without enabling checkout', async () => {
    render(<PaywallScreen />);
    expect(screen.getByTestId('premium-plan-yearly').props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByTestId('premium-plan-monthly'));
    expect(screen.getByText('Get monthly Plus')).toBeTruthy();
    fireEvent.press(screen.getByTestId('premium-plan-lifetime'));
    expect(screen.getByText('Get lifetime Plus')).toBeTruthy();
    expect(screen.getByText(/once\. No subscription or recurring payments\./)).toBeTruthy();
    fireEvent.press(screen.getByTestId('premium-continue'));
    expect(mockPurchase).not.toHaveBeenCalled();
    expect(screen.getByTestId('premium-continue').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Coming soon')).toBeTruthy();
    await act(async () => undefined);
  });

  it('uses local store prices and switches away from an unavailable default plan', async () => {
    mockConfigured = true;
    mockState.premium.status = 'ready';
    mockState.premium.products = [
      { id: 'monthly', productId: 'plus', price: 199, currency: 'INR', formattedPrice: '₹199.00' },
    ];
    render(<PaywallScreen />);
    expect(screen.getByText('₹199.00')).toBeTruthy();
    expect(screen.getByText('Get monthly Plus')).toBeTruthy();
    expect(screen.getByTestId('premium-plan-yearly').props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText(/SAVE/)).toBeNull();
    await act(async () => undefined);
  });

  it('prevents a second purchase while payment approval is pending', async () => {
    mockConfigured = true;
    mockState.premium.status = 'ready';
    mockState.premium.pending = true;
    mockState.premium.products = [
      { id: 'monthly', productId: 'plus', price: 1.99, currency: 'USD', formattedPrice: '$1.99' },
    ];
    render(<PaywallScreen />);
    expect(screen.getByText('Your payment is pending approval in Google Play.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('premium-continue'));
    expect(mockPurchase).not.toHaveBeenCalled();
    await act(async () => undefined);
  });

  it('returns quietly from a canceled Google Play checkout', async () => {
    mockConfigured = true;
    mockState.premium.status = 'ready';
    mockState.premium.products = [
      { id: 'monthly', productId: 'plus', price: 1.99, currency: 'USD', formattedPrice: '$1.99' },
    ];
    mockPurchase.mockRejectedValue({ code: 'USER_CANCELED' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<PaywallScreen />);
    fireEvent.press(screen.getByTestId('premium-continue'));
    await waitFor(() => expect(mockPurchase).toHaveBeenCalledWith('monthly'));
    await waitFor(() =>
      expect(screen.getByTestId('premium-continue').props.accessibilityState.busy).toBe(false),
    );
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
