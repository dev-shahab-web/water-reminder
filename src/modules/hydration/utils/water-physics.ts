export const WATER_COLUMNS = 25;
export const WATER_DROPLETS = 8;
const RADIUS = 109;
const SPACING = (RADIUS * 2) / (WATER_COLUMNS - 1);
// Spatial scale controls wave travel time across this small on-screen vessel.
const GRAVITY_SCALE = 300 / 9.81;
const MAX_WAVE = 38;

export type WaterDroplet = { x: number; y: number; vx: number; vy: number; life: number };
export type WaterSimulationState = {
  // Surface displacement (positive down), and horizontal flow at cell faces.
  heights: number[];
  velocities: number[];
  droplets: WaterDroplet[];
  emissionDelay: number;
  acceleration: number;
  normalGravity: number;
  spin: number;
};

export function createWaterSimulation(): WaterSimulationState {
  'worklet';
  return {
    heights: Array(WATER_COLUMNS).fill(0),
    velocities: Array(WATER_COLUMNS + 1).fill(0),
    droplets: Array.from({ length: WATER_DROPLETS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 })),
    emissionDelay: 0,
    acceleration: 0,
    normalGravity: 9.81,
    spin: 0,
  };
}

function clamp(value: number, limit: number) {
  'worklet';
  return Math.max(-limit, Math.min(limit, value));
}

/** A local impact displaces water, rather than rotating a flat texture. */
export function disturbWater(
  state: WaterSimulationState,
  horizontalImpulse = 0,
  verticalImpulse = 0,
  fillChange = 0,
): WaterSimulationState {
  'worklet';
  const flow = clamp(horizontalImpulse * 8, 90);
  const pour = clamp(fillChange * 115, 26);
  const vertical = clamp(verticalImpulse * 1.1, 12);
  const heights = state.heights.map((height, index) => {
    const t = index / (WATER_COLUMNS - 1);
    const impact = Math.exp(-Math.pow((t - 0.6) / 0.105, 2));
    // A pour dips locally and launches two ripples. The mean correction
    // redistributes this water; progress alone changes its volume.
    return height + pour * impact + vertical * Math.cos(t * Math.PI * 2);
  });
  const mean = heights.reduce((sum, height) => sum + height, 0) / WATER_COLUMNS;
  return {
    ...state,
    heights: heights.map((height) => clamp(height - mean, MAX_WAVE)),
    velocities: state.velocities.map((velocity, index) =>
      index === 0 || index === WATER_COLUMNS ? 0 : clamp(velocity + flow, 130),
    ),
  };
}

/**
 * A small shallow-water solver. Pressure gradients accelerate horizontal flow;
 * its divergence moves the surface. Closed faces reflect waves off the walls.
 * This is a surface approximation, not a full 3D fluid/particle simulation.
 */
export function stepWater(
  state: WaterSimulationState,
  elapsedSeconds: number,
  progress = 0.5,
): WaterSimulationState {
  'worklet';
  const elapsed = Math.max(0, Math.min(elapsedSeconds, 0.08));
  const steps = Math.max(1, Math.ceil(elapsed / (1 / 120)));
  const dt = elapsed / steps;
  let heights = state.heights.slice();
  const velocities = state.velocities.slice();
  const droplets = state.droplets.map((drop) => ({ ...drop }));
  let emissionDelay = state.emissionDelay;
  // A small pressure floor keeps this 2D surface model well behaved when the
  // phone is face up and most of gravity points through the screen.
  const gravity = Math.max(2, Math.min(24, state.normalGravity)) * GRAVITY_SCALE;
  // Shallow water moves more slowly. Keep a fixed mesh; the renderer maps it
  // to the circular surface chord, avoiding tiny unstable cells near empty.
  const depth = 22 + Math.max(0, Math.min(1, progress)) * 70;

  for (let step = 0; step < steps; step += 1) {
    const previousFlow = velocities.slice();
    for (let i = 1; i < WATER_COLUMNS; i += 1) {
      const pressure = (gravity * (heights[i] - heights[i - 1])) / SPACING;
      const viscosity = (previousFlow[i - 1] + previousFlow[i + 1] - 2 * previousFlow[i]) * 2.5;
      velocities[i] = clamp(
        // Rotation couples weakly through vessel drag; it cannot rotate the
        // equilibrium surface away from measured gravity after the phone stops.
        velocities[i] +
          (pressure +
            state.acceleration * GRAVITY_SCALE +
            state.spin * depth * 0.45 +
            viscosity -
            velocities[i] * 1.65) *
            dt,
        130,
      );
    }
    const next = heights.slice();
    for (let i = 0; i < WATER_COLUMNS; i += 1) {
      // Depth-dependent flux makes crests and troughs travel differently.
      const leftDepth = Math.max(8, depth - (heights[i] + heights[Math.max(0, i - 1)]) * 0.35);
      const rightDepth = Math.max(
        8,
        depth - (heights[i] + heights[Math.min(WATER_COLUMNS - 1, i + 1)]) * 0.35,
      );
      const movement =
        ((velocities[i + 1] * rightDepth - velocities[i] * leftDepth) / SPACING) * dt;
      next[i] = clamp(heights[i] + movement, MAX_WAVE);
    }
    const mean = next.reduce((sum, height) => sum + height, 0) / WATER_COLUMNS;
    for (let i = 0; i < WATER_COLUMNS; i += 1) next[i] -= mean;

    emissionDelay = Math.max(0, emissionDelay - dt);
    if (emissionDelay === 0) {
      for (let i = 1; i < WATER_COLUMNS - 1; i += 1) {
        const rise = (next[i] - heights[i]) / Math.max(dt, 0.0001);
        // Spray only from fast rising crests. No ambient particle emitter.
        if (next[i] < -7 && rise < -65) {
          const slot = droplets.findIndex((drop) => drop.life <= 0);
          if (slot !== -1) {
            droplets[slot] = {
              x: 21 + (i / (WATER_COLUMNS - 1)) * 218,
              y: next[i] - 2,
              vx: (velocities[i] + velocities[i + 1]) * 0.28,
              vy: Math.max(-125, rise * 0.65),
              life: 1,
            };
            emissionDelay = 0.09;
          }
          break;
        }
      }
    }
    for (const drop of droplets) {
      if (drop.life <= 0) continue;
      drop.vy += gravity * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.life -= dt * 1.8;
      const column = Math.max(0, Math.min(WATER_COLUMNS - 1, Math.round((drop.x - 21) / SPACING)));
      if (drop.x < 21 || drop.x > 239 || (drop.vy > 0 && drop.y >= next[column])) drop.life = 0;
    }
    heights = next;
  }
  return { ...state, heights, velocities, droplets, emissionDelay };
}

export function waterIsSettled(state: WaterSimulationState): boolean {
  'worklet';
  return (
    Math.abs(state.acceleration) < 0.12 &&
    Math.abs(state.spin) < 0.025 &&
    state.heights.every((height) => Math.abs(height) < 0.055) &&
    state.velocities.every((velocity) => Math.abs(velocity) < 0.06) &&
    state.droplets.every((drop) => drop.life <= 0)
  );
}

/** Invert a circular segment's area so the fill amount represents water volume. */
export function waterSurfaceLevel(progress: number): number {
  'worklet';
  if (progress <= 0) return 241;
  if (progress >= 1) return 19;
  let low = -1;
  let high = 1;
  for (let i = 0; i < 12; i += 1) {
    const y = (low + high) / 2;
    const area = (Math.acos(y) - y * Math.sqrt(1 - y * y)) / Math.PI;
    if (area > progress) low = y;
    else high = y;
  }
  return 130 + ((low + high) / 2) * RADIUS;
}

export function waterSurfacePoint(heights: number[], progress: number, t: number) {
  'worklet';
  const level = waterSurfaceLevel(progress);
  const halfWidth = Math.sqrt(Math.max(1, RADIUS * RADIUS - Math.pow(level - 130, 2)));
  const fade = Math.max(0, Math.min(1, progress * 10, (1 - progress) * 10));
  const column = Math.max(0, Math.min(WATER_COLUMNS - 1, t * (WATER_COLUMNS - 1)));
  const index = Math.floor(column);
  const height =
    heights[index] +
    (heights[Math.min(index + 1, WATER_COLUMNS - 1)] - heights[index]) * (column - index);
  return { x: 130 + (t * 2 - 1) * halfWidth, y: level + height * fade };
}

export function waterSurfacePath(heights: number[], progress: number, rear = false): string {
  'worklet';
  const level = waterSurfaceLevel(progress);
  const halfWidth = Math.sqrt(Math.max(1, RADIUS * RADIUS - Math.pow(level - 130, 2)));
  const fade = Math.max(0, Math.min(1, progress * 10, (1 - progress) * 10));
  const points = heights.map((height, index) => ({
    x: 130 + ((index / (WATER_COLUMNS - 1)) * 2 - 1) * halfWidth,
    y:
      level +
      fade *
        (rear ? height * 0.5 + heights[Math.min(index + 3, WATER_COLUMNS - 1)] * 0.3 - 2 : height),
  }));
  let path = `M 0 ${points[0].y.toFixed(2)} L ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const point = points[i];
    path += ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${((previous.x + point.x) / 2).toFixed(2)} ${((previous.y + point.y) / 2).toFixed(2)}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last.x.toFixed(2)} ${last.y.toFixed(2)} L 260 ${last.y.toFixed(2)} V 270 H 0 Z`;
}
