import type { AppStateStatus } from 'react-native';

type ContinuousMotionInput = {
  appState: AppStateStatus;
  isScreenFocused: boolean;
  reduceMotion: boolean;
};

export const shouldUseContinuousMotion = ({
  appState,
  isScreenFocused,
  reduceMotion,
}: ContinuousMotionInput): boolean => {
  return !reduceMotion && isScreenFocused && appState === 'active';
};
