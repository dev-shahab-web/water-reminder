import { describe, expect, it } from '@jest/globals';

import { shouldUseContinuousMotion } from './motion-preferences';

describe('motion preferences', () => {
  it('allows continuous water motion only when visible and motion is enabled', () => {
    expect(
      shouldUseContinuousMotion({
        appState: 'active',
        isScreenFocused: true,
        reduceMotion: false,
      }),
    ).toBe(true);
  });

  it('disables continuous motion for reduced motion, background, and unfocused screens', () => {
    expect(
      shouldUseContinuousMotion({
        appState: 'active',
        isScreenFocused: true,
        reduceMotion: true,
      }),
    ).toBe(false);
    expect(
      shouldUseContinuousMotion({
        appState: 'background',
        isScreenFocused: true,
        reduceMotion: false,
      }),
    ).toBe(false);
    expect(
      shouldUseContinuousMotion({
        appState: 'active',
        isScreenFocused: false,
        reduceMotion: false,
      }),
    ).toBe(false);
  });
});
