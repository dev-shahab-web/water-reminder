import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { logger } from '@core/logger';
import { useAppSelector } from '@state/store/hooks';
import { useSettingsSnapshot } from '@modules/settings';
import { useOnboardingState } from '@modules/onboarding';
import {
  playGoalCompleteHaptic,
  playWaterLogHaptic,
  playWaterRippleHaptic,
} from '@platform/haptics';

// One player for the application; each successful log restarts this short cue.
// Imported history, edits, refreshes and failed writes never emit this event.
export function HydrationFeedback() {
  const event = useAppSelector((state) => state.hydration.lastLogFeedback);
  const { state: onboarding } = useOnboardingState();
  const settings = useSettingsSnapshot();
  const player = useAudioPlayer(require('../../../../assets/audio/water-pour.wav'), {
    downloadFirst: true,
  });
  const handledId = useRef(event?.id);
  const audioReady = useRef<Promise<void> | undefined>(undefined);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    audioReady.current = setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    void audioReady.current.catch((error: unknown) =>
      logger.warn('Water sound unavailable.', { error }),
    );
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        player.pause();
        clearTimeout(rippleTimer.current);
      }
    });
    return () => {
      subscription.remove();
      clearTimeout(rippleTimer.current);
    };
  }, [player]);

  useEffect(() => {
    if (!settings.logSoundEnabled) player.pause();
    if (!event || handledId.current === event.id) return;
    handledId.current = event.id;
    if (AppState.currentState !== 'active') return;
    let cancelled = false;
    const goalReached =
      event.previousTotal < onboarding.hydrationGoal && event.nextTotal >= onboarding.hydrationGoal;
    void (goalReached ? playGoalCompleteHaptic() : playWaterLogHaptic());
    clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => {
      if (AppState.currentState === 'active') void playWaterRippleHaptic();
    }, 180);

    if (settings.logSoundEnabled) {
      void (async () => {
        try {
          await audioReady.current;
          if (cancelled || AppState.currentState !== 'active') return;
          player.pause();
          await player.seekTo(0);
          if (!cancelled && AppState.currentState === 'active') player.play();
        } catch (error) {
          // Sensory feedback must never change the result of a saved water log.
          logger.warn('Water sound could not play.', { error });
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [event, onboarding.hydrationGoal, player, settings.logSoundEnabled]);

  return null;
}
