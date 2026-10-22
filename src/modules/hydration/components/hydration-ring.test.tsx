import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { HydrationRing } from './hydration-ring';

let mockActiveSensors = 0;
jest.mock('./water-gravity-sensor', () => ({
  WaterGravitySensor: function MockGravitySensor() {
    // Model useAnimatedSensor's native subscription lifetime: register on
    // mount and unregister on unmount, including when Home stays in the stack.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    useEffect(() => {
      mockActiveSensors += 1;
      return () => {
        mockActiveSensors -= 1;
      };
    }, []);
    return null;
  },
}));

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
    useAnimatedReaction: jest.fn(),
    runOnJS: (callback: unknown) => callback,
    useFrameCallback: () => ({ setActive: jest.fn() }),
    useSharedValue: (value: unknown) => ({
      value,
      get() {
        return this.value;
      },
      set(next: unknown) {
        this.value = next;
      },
    }),
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

  it('releases the sensor when Home is inactive or reduced motion is enabled', () => {
    const view = render(<HydrationRing {...props} continuousMotionEnabled />);
    expect(mockActiveSensors).toBe(1);
    view.rerender(<HydrationRing {...props} />);
    expect(mockActiveSensors).toBe(0);
    view.rerender(<HydrationRing {...props} continuousMotionEnabled />);
    expect(mockActiveSensors).toBe(1);
    view.rerender(<HydrationRing {...props} continuousMotionEnabled reduceMotion />);
    expect(mockActiveSensors).toBe(0);
    view.rerender(<HydrationRing {...props} continuousMotionEnabled />);
    expect(mockActiveSensors).toBe(1);
    view.unmount();
    expect(mockActiveSensors).toBe(0);
  });

  it('only subscribes while there is a visible free water surface', () => {
    const view = render(<HydrationRing {...props} continuousMotionEnabled totalAmount={0} />);
    expect(mockActiveSensors).toBe(0);
    view.rerender(<HydrationRing {...props} continuousMotionEnabled />);
    expect(mockActiveSensors).toBe(1);
    view.rerender(
      <HydrationRing {...props} continuousMotionEnabled totalAmount={2000} remainingAmount={0} />,
    );
    expect(mockActiveSensors).toBe(0);
    view.rerender(
      <HydrationRing {...props} continuousMotionEnabled totalAmount={2200} remainingAmount={0} />,
    );
    expect(mockActiveSensors).toBe(0);
    view.rerender(<HydrationRing {...props} continuousMotionEnabled goalAmount={0} />);
    expect(mockActiveSensors).toBe(0);
  });
});
