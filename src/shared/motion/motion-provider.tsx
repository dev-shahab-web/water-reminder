import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

const MotionContext = createContext<boolean | undefined>(undefined);

export function MotionProvider({
  children,
  reduceMotion,
}: PropsWithChildren<{ reduceMotion: boolean }>) {
  const initialSystemPreference = useReducedMotion();
  const [systemReduceMotion, setSystemReduceMotion] = useState(initialSystemPreference);

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setSystemReduceMotion(enabled);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <MotionContext.Provider value={reduceMotion || systemReduceMotion}>
      {children}
    </MotionContext.Provider>
  );
}

export function useAppReduceMotion() {
  const preference = useContext(MotionContext);
  const systemPreference = useReducedMotion();
  return preference ?? systemPreference;
}
