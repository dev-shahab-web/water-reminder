import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { HydrationRing } from './hydration-ring';

jest.mock('react-native-paper', () => ({
  ...jest.requireActual<typeof import('react-native-paper')>('react-native-paper'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useTheme: () => require('@shared/theme').appDarkTheme,
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (component: unknown) => component },
    Easing: {
      out: (value: unknown) => value,
      cubic: jest.fn(),
      quad: jest.fn(),
      linear: jest.fn(),
    },
    cancelAnimation: jest.fn(),
    interpolate: () => 0,
    useAnimatedProps: (callback: () => unknown) => callback(),
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useFrameCallback: () => ({ setActive: jest.fn() }),
    useSharedValue: (value: unknown) => ({ value }),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

describe('HydrationRing committed amount', () => {
  const props = {
    continuousMotionEnabled: false,
    goalAmount: 2000,
    measurementUnit: 'ml' as const,
    message: 'Keep going',
    remainingAmount: 1750,
    totalAmount: 250,
  };

  it('updates the visible total for additions and removals without remounting', () => {
    const view = render(<HydrationRing {...props} />);
    expect(view.getByText('250', { includeHiddenElements: true })).toBeTruthy();
    view.rerender(<HydrationRing {...props} totalAmount={750} remainingAmount={1250} />);
    expect(view.getByText('750', { includeHiddenElements: true })).toBeTruthy();
    expect(view.queryByText('250', { includeHiddenElements: true })).toBeNull();
    view.rerender(<HydrationRing {...props} />);
    expect(view.getByText('250', { includeHiddenElements: true })).toBeTruthy();
    expect(view.queryByText('750', { includeHiddenElements: true })).toBeNull();
  });

  it('renders the current measurement unit without retaining the ml value', () => {
    const view = render(<HydrationRing {...props} />);
    view.rerender(<HydrationRing {...props} measurementUnit="oz" />);
    expect(view.getByText('8.45', { includeHiddenElements: true })).toBeTruthy();
    expect(view.queryByText('250', { includeHiddenElements: true })).toBeNull();
  });
});
