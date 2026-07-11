export const motionDuration = {
  fast: 140,
  standard: 240,
  slow: 340,
} as const;

export const getMotionDuration = (duration: number, reduceMotion: boolean): number => {
  return reduceMotion ? 0 : duration;
};
