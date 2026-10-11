import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';

import { MotionProvider, useAppReduceMotion } from './motion-provider';

jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));

function MotionState() {
  return <Text>{useAppReduceMotion() ? 'Quiet' : 'Animated'}</Text>;
}

afterEach(() => jest.restoreAllMocks());

describe('shared motion preferences', () => {
  it('updates consumers immediately when the app preference changes', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const view = render(
      <MotionProvider reduceMotion={false}>
        <MotionState />
      </MotionProvider>,
    );
    await waitFor(() => expect(screen.getByText('Animated')).toBeTruthy());
    view.rerender(
      <MotionProvider reduceMotion>
        <MotionState />
      </MotionProvider>,
    );
    expect(screen.getByText('Quiet')).toBeTruthy();
    view.rerender(
      <MotionProvider reduceMotion={false}>
        <MotionState />
      </MotionProvider>,
    );
    expect(screen.getByText('Animated')).toBeTruthy();
  });

  it('honors live system changes even when the app preference is off and removes the listener', async () => {
    let notify: (enabled: boolean) => void = () => undefined;
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
      notify = listener as (enabled: boolean) => void;
      return { remove };
    });
    const view = render(
      <MotionProvider reduceMotion={false}>
        <MotionState />
      </MotionProvider>,
    );
    await waitFor(() => expect(screen.getByText('Quiet')).toBeTruthy());
    act(() => notify(false));
    expect(screen.getByText('Animated')).toBeTruthy();
    act(() => notify(true));
    expect(screen.getByText('Quiet')).toBeTruthy();
    view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
