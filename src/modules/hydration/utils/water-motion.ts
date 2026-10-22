export type WaterVector = { x: number; y: number; z: number };
export type WaterSensorSample = {
  gravity: WaterVector;
  acceleration: WaterVector;
  gyroscope: WaterVector;
  gravityAt: number;
  accelerationAt: number;
  gyroscopeAt: number;
};

export function emptyWaterSample(): WaterSensorSample {
  'worklet';
  return {
    gravity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    gravityAt: 0,
    accelerationAt: 0,
    gyroscopeAt: 0,
  };
}

export type WaterMotionState = {
  gravity: WaterVector;
  angle: number;
  initialized: boolean;
  updatedAt: number;
  gravityAt: number;
  acceleration: number;
  normalGravity: number;
  normalAcceleration: number;
  spin: number;
  rock: number;
  angularSpeed: number;
  alignmentError: number;
};

export function createWaterMotion(): WaterMotionState {
  'worklet';
  return {
    gravity: { x: 0, y: -9.81, z: 0 },
    angle: 0,
    initialized: false,
    updatedAt: 0,
    gravityAt: 0,
    acceleration: 0,
    normalGravity: 9.81,
    normalAcceleration: 0,
    spin: 0,
    rock: 0,
    angularSpeed: 0,
    alignmentError: 0,
  };
}

/** Sensor +Y points up; the SVG's +Y points down. */
export function gravityToWaterAngle(x: number, y: number, z: number): number | null {
  'worklet';
  const magnitude = Math.hypot(x, y, z);
  // Only the truly ambiguous, noise-sized projection is ignored. The previous
  // 18% cutoff froze an old angle even on a motionless, slightly inclined phone.
  if (!Number.isFinite(magnitude) || magnitude < 0.01 || Math.hypot(x, y) < 0.08) return null;
  return Math.atan2(-x, -y);
}

export function nearestWaterAngle(angle: number, previous: number): number {
  'worklet';
  return previous + Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
}

/** Components along the surface and into the water, in the same physical frame. */
export function projectWaterVector(vector: WaterVector, angle: number) {
  'worklet';
  return {
    tangent: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
    normal: -vector.x * Math.sin(angle) - vector.y * Math.cos(angle),
  };
}

function finiteVector(vector: WaterVector) {
  'worklet';
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z);
}

function fresh(timestamp: number, now: number, limit: number) {
  'worklet';
  return timestamp > 0 && now >= timestamp && now - timestamp <= limit;
}

/** World gravity seen in a rotating device follows dg/dt = -omega cross g. */
export function predictWaterGravity(
  gravity: WaterVector,
  gyro: WaterVector,
  dt: number,
): WaterVector {
  'worklet';
  const speed = Math.hypot(gyro.x, gyro.y, gyro.z);
  if (speed < 0.0001 || dt <= 0) return gravity;
  const x = gyro.x / speed;
  const y = gyro.y / speed;
  const z = gyro.z / speed;
  const angle = -speed * dt;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = x * gravity.x + y * gravity.y + z * gravity.z;
  return {
    x: gravity.x * c + (y * gravity.z - z * gravity.y) * s + x * dot * (1 - c),
    y: gravity.y * c + (z * gravity.x - x * gravity.z) * s + y * dot * (1 - c),
    z: gravity.z * c + (x * gravity.y - y * gravity.x) * s + z * dot * (1 - c),
  };
}

/**
 * Synchronize the latest streams on the UI clock. Gyro predicts between gravity
 * updates; measured gravity removes drift and determines the resting direction.
 * Reanimated exposes delivery times, not hardware timestamps, so stale streams
 * expire and prediction is strictly bounded instead of integrating indefinitely.
 */
export function updateWaterMotion(
  previous: WaterMotionState,
  sample: WaterSensorSample,
  now: number,
): WaterMotionState {
  'worklet';
  const dt =
    previous.updatedAt > 0 ? Math.max(0, Math.min(0.05, (now - previous.updatedAt) / 1000)) : 0;
  const gyroFresh = fresh(sample.gyroscopeAt, now, 120) && finiteVector(sample.gyroscope);
  const readingGyro = gyroFresh ? sample.gyroscope : { x: 0, y: 0, z: 0 };
  const linear =
    fresh(sample.accelerationAt, now, 150) && finiteVector(sample.acceleration)
      ? sample.acceleration
      : { x: 0, y: 0, z: 0 };
  const angularSpeed = Math.hypot(readingGyro.x, readingGyro.y, readingGyro.z);
  // Gyro bias is magnified when projecting an almost-flat phone. Below this
  // noise floor gravity alone tracks slow movement without accumulating drift.
  const gyro = angularSpeed > 0.015 ? readingGyro : { x: 0, y: 0, z: 0 };
  let gravity =
    previous.initialized && fresh(previous.gravityAt, now, 250)
      ? predictWaterGravity(previous.gravity, gyro, dt)
      : previous.gravity;
  let initialized = previous.initialized;
  let gravityAt = previous.gravityAt;
  const validGravity =
    fresh(sample.gravityAt, now, 250) &&
    finiteVector(sample.gravity) &&
    Math.hypot(sample.gravity.x, sample.gravity.y, sample.gravity.z) > 1;
  if (validGravity && sample.gravityAt !== previous.gravityAt) {
    const interval =
      previous.gravityAt > 0
        ? Math.max(0, Math.min(0.25, (sample.gravityAt - previous.gravityAt) / 1000))
        : 0.05;
    const quiet = angularSpeed < 0.04 && Math.hypot(linear.x, linear.y, linear.z) < 0.25;
    const nearFlat = Math.hypot(sample.gravity.x, sample.gravity.y) < 0.6;
    const gain =
      !initialized || (quiet && !nearFlat) ? 1 : 1 - Math.exp(-interval * (nearFlat ? 10 : 18));
    gravity = {
      x: gravity.x + (sample.gravity.x - gravity.x) * gain,
      y: gravity.y + (sample.gravity.y - gravity.y) * gain,
      z: gravity.z + (sample.gravity.z - gravity.z) * gain,
    };
    initialized = true;
    gravityAt = sample.gravityAt;
  }
  const heading = initialized ? gravityToWaterAngle(gravity.x, gravity.y, gravity.z) : null;
  const target = heading === null ? previous.angle : nearestWaterAngle(heading, previous.angle);
  // A short, non-overshooting response gives the fluid time to redistribute.
  // Especially near face-up, a tiny rock must not whip the entire surface
  // around the rim. Gravity remains the absolute target until alignment settles.
  const response = Math.hypot(gravity.x, gravity.y) < 1 ? 0.18 : 0.12;
  const turn = (target - previous.angle) * (1 - Math.exp(-dt / response));
  const angle = !previous.initialized
    ? target
    : previous.angle + Math.max(-4 * dt, Math.min(4 * dt, turn));
  const measuredHeading = validGravity
    ? gravityToWaterAngle(sample.gravity.x, sample.gravity.y, sample.gravity.z)
    : null;
  const alignmentError =
    measuredHeading === null ? 0 : nearestWaterAngle(measuredHeading, angle) - angle;
  const projected = projectWaterVector(linear, angle);
  const projectedGravity = projectWaterVector(gravity, angle);
  // Include pitch/roll, not just rotation around the screen normal. Bound the
  // nearly-flat denominator so rocking cannot create a singular impulse.
  const spin =
    gyro.z +
    (gravity.z * (gyro.x * Math.sin(angle) + gyro.y * Math.cos(angle))) /
      Math.max(4, Math.hypot(gravity.x, gravity.y));
  const rock = gyro.x * Math.cos(angle) - gyro.y * Math.sin(angle);
  const coupling = !previous.initialized ? 1 : 1 - Math.exp(-dt / 0.075);
  const smoothSpin = gyroFresh ? previous.spin + (spin - previous.spin) * coupling : 0;
  const smoothRock = gyroFresh ? previous.rock + (rock - previous.rock) * coupling : 0;
  // While the fluid lags a turn, gravity itself pushes it downhill across the
  // surface. At equilibrium this component is exactly zero in every orientation.
  const tangent = projected.tangent + (initialized ? projectedGravity.tangent : 0);
  return {
    gravity,
    angle,
    initialized,
    updatedAt: now,
    gravityAt,
    acceleration: Math.abs(tangent) > 0.15 ? Math.max(-14, Math.min(14, tangent)) : 0,
    normalGravity: initialized ? Math.max(0, projectedGravity.normal) : 9.81,
    normalAcceleration:
      Math.abs(projected.normal) > 0.18 ? Math.max(-14, Math.min(14, projected.normal)) : 0,
    spin: Math.abs(smoothSpin) > 0.025 ? Math.max(-6, Math.min(6, smoothSpin)) : 0,
    rock: Math.abs(smoothRock) > 0.025 ? Math.max(-6, Math.min(6, smoothRock)) : 0,
    angularSpeed,
    alignmentError,
  };
}
