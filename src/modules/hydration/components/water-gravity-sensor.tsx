import { Platform } from 'react-native';
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  type SharedValue,
} from 'react-native-reanimated';
import type { WaterSensorSample } from '../utils/water-motion';

/** Mount only for a visible partial fill; every subscription stops on unmount. */
export function WaterGravitySensor({ sample }: { sample: SharedValue<WaterSensorSample> }) {
  const gravity = useAnimatedSensor(SensorType.GRAVITY, {
    interval: 50,
    adjustToInterfaceOrientation: true,
  });
  const gyroscope = useAnimatedSensor(SensorType.GYROSCOPE, {
    interval: 20,
    adjustToInterfaceOrientation: true,
  });
  // Android maps ACCELEROMETER to TYPE_LINEAR_ACCELERATION; iOS returns raw.
  const acceleration = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 33,
    adjustToInterfaceOrientation: true,
  });

  useAnimatedReaction(
    () => gravity.sensor.value,
    (reading, previous) => {
      // Do not re-date a cached reading from before a subscription was mounted.
      if (previous === null) return;
      sample.set((current) => ({
        ...current,
        gravity: { x: reading.x, y: reading.y, z: reading.z },
        gravityAt: Date.now(),
      }));
    },
  );
  useAnimatedReaction(
    () => gyroscope.sensor.value,
    (reading, previous) => {
      if (previous === null) return;
      sample.set((current) => ({
        ...current,
        gyroscope: { x: reading.x, y: reading.y, z: reading.z },
        gyroscopeAt: Date.now(),
      }));
    },
  );
  useAnimatedReaction(
    () => acceleration.sensor.value,
    (reading, previous) => {
      if (previous === null) return;
      const g = gravity.sensor.value;
      sample.set((current) => ({
        ...current,
        acceleration: {
          x: reading.x - (Platform.OS === 'ios' ? g.x : 0),
          y: reading.y - (Platform.OS === 'ios' ? g.y : 0),
          z: reading.z - (Platform.OS === 'ios' ? g.z : 0),
        },
        accelerationAt: Date.now(),
      }));
    },
  );
  return null;
}
