import { describe, expect, it } from '@jest/globals';

import { getMotionDuration, motionDuration } from './motion-tokens';

describe('motion tokens', () => {
  it('keeps product motion short and calm', () => {
    expect(motionDuration.fast).toBeLessThanOrEqual(180);
    expect(motionDuration.standard).toBeLessThanOrEqual(300);
    expect(motionDuration.slow).toBeLessThanOrEqual(400);
  });

  it('respects reduced motion with zero-duration transitions', () => {
    expect(getMotionDuration(motionDuration.standard, true)).toBe(0);
    expect(getMotionDuration(motionDuration.standard, false)).toBe(motionDuration.standard);
  });
});
