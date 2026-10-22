import { describe, expect, it } from '@jest/globals';
import {
  createWaterSimulation,
  disturbWater,
  stepWater,
  waterIsSettled,
  waterSurfaceLevel,
  waterSurfacePath,
} from './water-physics';

describe('liquid surface physics', () => {
  it('propagates a local pour into neighbouring surface columns and conserves mean height', () => {
    let state = disturbWater(createWaterSimulation(), 0, 0, 0.25);
    const first = stepWater(state, 1 / 30);
    for (let i = 0; i < 15; i += 1) state = stepWater(state, 1 / 30);
    expect(Math.max(...state.heights) - Math.min(...state.heights)).toBeGreaterThan(2);
    expect(state.heights).not.toEqual(first.heights);
    expect(state.heights.reduce((sum, height) => sum + height, 0)).toBeCloseTo(0, 8);
  });

  it('removing water produces waves with opposite momentum', () => {
    const add = disturbWater(createWaterSimulation(), 0, 0, 0.2);
    const remove = disturbWater(createWaterSimulation(), 0, 0, -0.2);
    add.heights.forEach((height, index) => expect(height).toBeCloseTo(-remove.heights[index], 8));
  });

  it('responds to shaking without requiring an orientation change', () => {
    const shaking = stepWater(disturbWater(createWaterSimulation(), 8, 4), 1 / 30);

    expect(Math.max(...shaking.heights) - Math.min(...shaking.heights)).toBeGreaterThan(3);
    expect(waterIsSettled(shaking)).toBe(false);
  });

  it('piles water against a wall and sends a curved wave inward after a sideways impulse', () => {
    let state = disturbWater(createWaterSimulation(), 8);
    for (let i = 0; i < 6; i += 1) state = stepWater(state, 1 / 30);
    expect(state.heights[0]).toBeGreaterThan(3);
    expect(state.heights[24]).toBeLessThan(-3);
    // A rotated plane cannot satisfy this curvature check.
    const curvature = state.heights
      .slice(1, -1)
      .map((h, i) => Math.abs(state.heights[i] + state.heights[i + 2] - 2 * h));
    expect(Math.max(...curvature)).toBeGreaterThan(0.5);
    let reflected = false;
    // The slower bulk-flow scale takes about two seconds to cross and rebound.
    for (let i = 0; i < 90; i += 1) {
      state = stepWater(state, 1 / 30);
      if (state.heights[0] < -1) reflected = true;
    }
    expect(reflected).toBe(true);
  });

  it('responds to sustained acceleration and settles after release, including spray', () => {
    let state = { ...createWaterSimulation(), acceleration: 9 };
    for (let i = 0; i < 15; i += 1) state = stepWater(state, 1 / 30);
    expect(Math.max(...state.heights) - Math.min(...state.heights)).toBeGreaterThan(15);
    expect(waterIsSettled(state)).toBe(false);
    state.acceleration = 0;
    for (let i = 0; i < 360; i += 1) state = stepWater(state, 1 / 30);
    expect(waterIsSettled(state)).toBe(true);
  });

  it('retains fluid momentum after rotation stops and eventually sleeps', () => {
    let state = { ...createWaterSimulation(), spin: 2 };
    for (let i = 0; i < 12; i += 1) state = stepWater(state, 1 / 30);
    expect(Math.max(...state.heights) - Math.min(...state.heights)).toBeGreaterThan(2);
    state.spin = 0;
    for (let i = 0; i < 300; i += 1) state = stepWater(state, 1 / 30);
    expect(waterIsSettled(state)).toBe(true);
  });

  it('produces the same motion at 30 and 60 fps and stays bounded after a long pause', () => {
    const initial = disturbWater(createWaterSimulation(), 7, -5, 0.25);
    let slow = initial;
    let fast = initial;
    for (let i = 0; i < 30; i += 1) slow = stepWater(slow, 1 / 30);
    for (let i = 0; i < 60; i += 1) fast = stepWater(fast, 1 / 60);
    slow.heights.forEach((height, index) => expect(height).toBeCloseTo(fast.heights[index], 6));
    const resumed = stepWater(initial, 120);
    expect(
      resumed.heights.every((height) => Number.isFinite(height) && Math.abs(height) < 64),
    ).toBe(true);
  });

  it('maps progress to circular water area and produces closed finite surface paths', () => {
    for (const progress of [0.05, 0.25, 0.5, 0.75, 0.95]) {
      const normalized = (waterSurfaceLevel(progress) - 130) / 109;
      const area =
        (Math.acos(normalized) - normalized * Math.sqrt(1 - normalized * normalized)) / Math.PI;
      expect(area).toBeCloseTo(progress, 3);
      const path = waterSurfacePath(createWaterSimulation().heights, progress);
      expect(path.endsWith('Z')).toBe(true);
      expect(path).not.toMatch(/NaN|Infinity/);
    }
    expect(waterSurfaceLevel(0)).toBeGreaterThan(239);
    expect(waterSurfaceLevel(1)).toBeLessThan(21);
  });
});
