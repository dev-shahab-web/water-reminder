import { describe, expect, it } from '@jest/globals';

import {
  createWaterMotion,
  emptyWaterSample,
  gravityToWaterAngle,
  nearestWaterAngle,
  predictWaterGravity,
  projectWaterVector,
  updateWaterMotion,
} from './water-motion';
import { createWaterSimulation, stepWater, waterIsSettled } from './water-physics';

describe('water gravity geometry', () => {
  it('keeps the surface perpendicular to gravity in screen coordinates', () => {
    for (const [x, y, z] of [
      [0, -9.81, 0],
      [4.9, -8.5, 0],
      [-9.81, 0, 0],
      [0, 9.81, 0],
    ]) {
      const angle = gravityToWaterAngle(x, y, z)!;
      // Reanimated's +Y points up; React Native's screen +Y points down.
      const tangentDotGravity = Math.cos(angle) * x - Math.sin(angle) * y;
      expect(tangentDotGravity).toBeCloseTo(0, 8);
      // The liquid must occupy the downward half, not its mirror image.
      expect(-Math.sin(angle) * x - Math.cos(angle) * y).toBeGreaterThan(0);
    }
  });

  it('ignores a flat phone, unavailable sensor readings, and invalid readings', () => {
    for (const [x, y, z] of [
      [0, 0, 0],
      [0.02, -0.03, 9.81],
      [0.02, 0.03, -9.81],
      [NaN, -1, 0],
      [Infinity, 0, 1],
    ]) {
      expect(gravityToWaterAngle(x, y, z)).toBeNull();
    }
  });

  it('works with both Android m/s² and iOS g units', () => {
    expect(gravityToWaterAngle(4.905, -8.4957, 0)).toBeCloseTo(
      gravityToWaterAngle(0.5, -0.866, 0)!,
      3,
    );
  });

  it('crosses upside-down through the shortest angle without a full spin', () => {
    const previous = (179 * Math.PI) / 180;
    const next = nearestWaterAngle((-179 * Math.PI) / 180, previous);
    expect(next - previous).toBeCloseTo((2 * Math.PI) / 180);
    expect(nearestWaterAngle(previous, next)).toBeCloseTo(previous);
    expect(nearestWaterAngle(0.1, Math.PI * 8)).toBeCloseTo(Math.PI * 8 + 0.1);
  });
});

describe('synchronized motion and physical settling', () => {
  it('maps sensor +Y up into SVG +Y down at every vessel orientation', () => {
    for (const angle of [0, 0.7, Math.PI / 2, 2.4, Math.PI, 4.2, 5.7]) {
      const down = { x: -Math.sin(angle) * 9.81, y: -Math.cos(angle) * 9.81, z: 0 };
      const projected = projectWaterVector(down, angle);
      expect(projected.tangent).toBeCloseTo(0, 8);
      expect(projected.normal).toBeCloseTo(9.81, 8);
      const alongSurface = { x: Math.cos(angle) * 3, y: -Math.sin(angle) * 3, z: 0 };
      expect(projectWaterVector(alongSurface, angle).tangent).toBeCloseTo(3, 8);
      expect(projectWaterVector(alongSurface, angle).normal).toBeCloseTo(0, 8);
    }
  });

  it('predicts device rotation using all three gyro axes without changing gravity magnitude', () => {
    const gravity = { x: 0, y: -9.81, z: 0 };
    const turned = predictWaterGravity(gravity, { x: 0, y: 0, z: Math.PI / 2 }, 1);
    expect(turned.x).toBeCloseTo(-9.81, 8);
    expect(turned.y).toBeCloseTo(0, 8);
    const faceUp = predictWaterGravity(gravity, { x: -Math.PI / 2, y: 0, z: 0 }, 1);
    expect(faceUp.z).toBeCloseTo(-9.81, 8);
    const sideways = predictWaterGravity(faceUp, { x: 0, y: Math.PI / 2, z: 0 }, 1);
    expect(sideways.x).toBeCloseTo(9.81, 8);
    expect(Math.hypot(sideways.x, sideways.y, sideways.z)).toBeCloseTo(9.81, 8);
  });

  it('tracks gyro between slower gravity updates and anchors to gravity when held still', () => {
    let motion = createWaterMotion();
    let sample = emptyWaterSample();
    for (let i = 0; i <= 100; i += 1) {
      const now = 1000 + i * 20;
      const angle = Math.min(i, 50) * 0.02 * 1.3;
      sample = { ...sample, gyroscope: { x: 0, y: 0, z: i < 50 ? 1.3 : 0 }, gyroscopeAt: now };
      if (i % 5 === 0)
        sample = {
          ...sample,
          gravity: { x: -9.81 * Math.sin(angle), y: -9.81 * Math.cos(angle), z: 0 },
          gravityAt: now,
        };
      motion = updateWaterMotion(motion, sample, now);
      expect(Math.abs(motion.angle - angle)).toBeLessThan(0.2);
    }
    expect(motion.angle).toBeCloseTo(1.3, 3);
    expect(motion.alignmentError).toBeCloseTo(0, 3);
  });

  it('does not freeze an old slope on the slightly inclined Pixel 7 reading', () => {
    // Native observation: (-0.02, 0.25, 9.81); Reanimated negates gravity.
    const gravity = { x: 0.02, y: -0.25, z: -9.81 };
    let motion = { ...createWaterMotion(), angle: 0.21, initialized: true };
    for (let i = 0; i < 40; i += 1) {
      const now = 1000 + i * 50;
      motion = updateWaterMotion(motion, { ...emptyWaterSample(), gravity, gravityAt: now }, now);
    }
    expect(motion.angle).toBeCloseTo(Math.atan2(-0.02, 0.25), 4);
    expect(motion.alignmentError).toBeCloseTo(0, 4);
  });

  it('redistributes gradually after a turn without overshooting the gravity target', () => {
    let motion = updateWaterMotion(
      createWaterMotion(),
      { ...emptyWaterSample(), gravity: { x: 0, y: -9.81, z: 0 }, gravityAt: 1000 },
      1000,
    );
    const target = 1.1;
    for (let i = 1; i <= 60; i += 1) {
      const now = 1000 + i * 20;
      const next = updateWaterMotion(
        motion,
        {
          ...emptyWaterSample(),
          gravityAt: now,
          gravity: { x: -9.81 * Math.sin(target), y: -9.81 * Math.cos(target), z: 0 },
        },
        now,
      );
      expect(next.angle).toBeGreaterThanOrEqual(motion.angle);
      expect(next.angle).toBeLessThanOrEqual(target);
      if (i === 1) expect(next.angle).toBeLessThan(0.1);
      motion = next;
    }
    expect(motion.angle).toBeCloseTo(target, 3);
    expect(motion.acceleration).toBe(0);
  });

  it('expires stale force and gyro samples instead of pushing or drifting indefinitely', () => {
    const sample = {
      ...emptyWaterSample(),
      gravity: { x: 0, y: -9.81, z: 0 },
      gravityAt: 1000,
      acceleration: { x: 6, y: -2, z: 0 },
      accelerationAt: 1000,
      gyroscope: { x: 0, y: 0, z: 2 },
      gyroscopeAt: 1000,
    };
    const moving = updateWaterMotion(createWaterMotion(), sample, 1000);
    expect(moving.acceleration).toBe(6);
    const stopped = updateWaterMotion(moving, sample, 1400);
    expect(stopped.acceleration).toBe(0);
    expect(stopped.spin).toBe(0);
    expect(stopped.angle).toBe(moving.angle);
  });

  it('couples pitch and roll into sloshing while ignoring stationary gyro bias', () => {
    const sample = { ...emptyWaterSample(), gravity: { x: 0, y: -1, z: -9.75 }, gravityAt: 1000 };
    const sideways = updateWaterMotion(
      createWaterMotion(),
      { ...sample, gyroscope: { x: 0, y: 1, z: 0 }, gyroscopeAt: 1000 },
      1000,
    );
    expect(sideways.spin).toBeLessThan(-2);
    const forward = updateWaterMotion(
      createWaterMotion(),
      { ...sample, gyroscope: { x: 1, y: 0, z: 0 }, gyroscopeAt: 1000 },
      1000,
    );
    expect(forward.rock).toBeCloseTo(1, 8);
    let quiet = updateWaterMotion(createWaterMotion(), sample, 1000);
    for (let i = 1; i <= 10; i += 1) {
      quiet = updateWaterMotion(
        quiet,
        { ...sample, gyroscope: { x: 0.004, y: -0.005, z: 0.003 }, gyroscopeAt: 1000 + i * 20 },
        1000 + i * 20,
      );
    }
    expect(quiet.angle).toBe(0);
    expect(quiet.spin).toBe(0);
    expect(quiet.rock).toBe(0);
  });

  it('settles perpendicular to gravity after a shake at upright, tilted and inverted angles', () => {
    for (const angle of [0, 0.7, Math.PI / 2, 2.4, Math.PI, -2.7]) {
      let motion = createWaterMotion();
      let water = createWaterSimulation();
      const gravity = { x: -Math.sin(angle) * 9.81, y: -Math.cos(angle) * 9.81, z: 0 };
      for (let i = 0; i < 360; i += 1) {
        const now = 1000 + i * (1000 / 30);
        const shake = i < 18 ? Math.sin(i) * 7 : 0;
        const acceleration = { x: Math.cos(angle) * shake, y: -Math.sin(angle) * shake, z: 0 };
        motion = updateWaterMotion(
          motion,
          { ...emptyWaterSample(), gravity, gravityAt: now, acceleration, accelerationAt: now },
          now,
        );
        water = stepWater(
          {
            ...water,
            acceleration: motion.acceleration,
            normalGravity: motion.normalGravity + motion.normalAcceleration,
            spin: motion.spin,
          },
          1 / 30,
        );
      }
      expect(waterIsSettled(water)).toBe(true);
      expect(projectWaterVector(gravity, motion.angle).tangent).toBeCloseTo(0, 8);
      expect(projectWaterVector(gravity, motion.angle).normal).toBeGreaterThan(0);
    }
  });
});
