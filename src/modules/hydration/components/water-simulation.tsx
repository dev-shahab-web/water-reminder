import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { createWaterMotion, emptyWaterSample, updateWaterMotion } from '../utils/water-motion';
import {
  createWaterSimulation,
  disturbWater,
  stepWater,
  waterIsSettled,
  type WaterDroplet,
} from '../utils/water-physics';
import { WaterGravitySensor } from './water-gravity-sensor';

export function WaterSimulation({
  hasFreeSurface,
  disturbance,
  tilt,
  heights,
  droplets,
  progress,
}: {
  hasFreeSurface: boolean;
  disturbance: SharedValue<number>;
  tilt: SharedValue<number>;
  heights: SharedValue<number[]>;
  droplets: SharedValue<WaterDroplet[]>;
  progress: SharedValue<number>;
}) {
  const simulation = useSharedValue(createWaterSimulation());
  const motion = useSharedValue(createWaterMotion());
  const sample = useSharedValue(emptyWaterSample());
  const lastNormalAcceleration = useSharedValue(0);
  const lastRotation = useSharedValue({ spin: 0, rock: 0 });
  const lastFill = useSharedValue<number | null>(null);
  const awake = useSharedValue(false);
  const accumulatedMs = useSharedValue(0);
  const controller = useRef<{ setActive: (active: boolean) => void } | null>(null);
  const wake = useCallback(() => controller.current?.setActive(true), []);
  const sleep = useCallback(() => {
    if (!awake.get()) controller.current?.setActive(false);
  }, [awake]);

  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    const currentMotion = updateWaterMotion(motion.value, sample.value, Date.now());
    motion.set(currentMotion);
    accumulatedMs.value += Math.min(timeSincePreviousFrame ?? 17, 80);
    // Fast hand movement gets display-rate tracking; the decaying waves use
    // 30 fps. Both stop entirely at rest. Physics always uses small substeps.
    const frameMs =
      currentMotion.angularSpeed > 0.15 || Math.abs(currentMotion.acceleration) > 0.6
        ? 1000 / 60
        : 1000 / 30;
    if (accumulatedMs.value < frameMs) return;
    const advanceMs = Math.floor(accumulatedMs.value / frameMs) * frameMs;
    accumulatedMs.value -= advanceMs;
    const next = stepWater(
      {
        ...simulation.value,
        acceleration: currentMotion.acceleration,
        normalGravity: currentMotion.normalGravity + currentMotion.normalAcceleration,
        spin: currentMotion.spin,
      },
      advanceMs / 1000,
      progress.value,
    );
    // The brief response is anchored to measured down and cannot overshoot it.
    tilt.set(currentMotion.angle);
    if (
      waterIsSettled(next) &&
      currentMotion.angularSpeed < 0.04 &&
      Math.abs(currentMotion.alignmentError) < 0.004
    ) {
      const rest = createWaterSimulation();
      simulation.set(rest);
      heights.set(rest.heights);
      droplets.set(rest.droplets);
      awake.set(false);
      accumulatedMs.set(0);
      runOnJS(sleep)();
    } else {
      simulation.set(next);
      heights.set(next.heights);
      droplets.set(next.droplets);
    }
  }, false);

  useEffect(() => {
    controller.current = frame;
    return () => {
      frame.setActive(false);
      controller.current = null;
    };
  }, [frame]);

  useEffect(() => {
    if (!hasFreeSurface) {
      frame.setActive(false);
      awake.set(false);
      const rest = createWaterSimulation();
      simulation.set(rest);
      motion.set(createWaterMotion());
      sample.set(emptyWaterSample());
      lastNormalAcceleration.set(0);
      lastRotation.set({ spin: 0, rock: 0 });
      accumulatedMs.set(0);
      heights.set(rest.heights);
      droplets.set(rest.droplets);
      tilt.set(0);
    }
  }, [
    accumulatedMs,
    awake,
    droplets,
    frame,
    hasFreeSurface,
    heights,
    lastNormalAcceleration,
    lastRotation,
    motion,
    sample,
    simulation,
    tilt,
  ]);

  useAnimatedReaction(
    () => sample.value,
    (reading) => {
      if (!hasFreeSurface) return;
      const next = updateWaterMotion(motion.value, reading, Date.now());
      motion.set(next);
      const verticalChange = next.normalAcceleration - lastNormalAcceleration.value;
      const impact = Math.abs(verticalChange) > 0.6;
      const spinChange = next.spin - lastRotation.value.spin;
      const rockChange = next.rock - lastRotation.value.rock;
      const rotating = Math.abs(spinChange) + Math.abs(rockChange) > 0.06;
      if (impact || rotating) {
        if (impact) lastNormalAcceleration.set(next.normalAcceleration);
        if (rotating) lastRotation.set({ spin: next.spin, rock: next.rock });
        // Angular acceleration transfers momentum at the walls. The opposite
        // impulse when the phone stops launches a rebound instead of freezing.
        simulation.set(
          disturbWater(
            simulation.value,
            rotating ? spinChange * 2.5 : 0,
            (impact ? verticalChange : 0) + (rotating ? rockChange * 2.2 : 0),
          ),
        );
      }
      const moving =
        next.angularSpeed > 0.04 ||
        Math.abs(next.acceleration) > 0.15 ||
        Math.abs(next.angle - tilt.value) > 0.004 ||
        Math.abs(next.alignmentError) > 0.004 ||
        impact ||
        rotating;
      if (moving && !awake.value) {
        awake.set(true);
        runOnJS(wake)();
      }
    },
  );

  useAnimatedReaction(
    () => disturbance.value,
    (change) => {
      const delta = lastFill.value === null ? 0 : change - lastFill.value;
      lastFill.set(change);
      if (!hasFreeSurface || delta === 0) return;
      simulation.set(disturbWater(simulation.value, 0, 0, delta));
      if (!awake.value) {
        awake.set(true);
        runOnJS(wake)();
      }
    },
  );
  return hasFreeSurface && Platform.OS !== 'web' ? <WaterGravitySensor sample={sample} /> : null;
}
