import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { AppScreen } from './app-screen';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
};

export function ScreenContainer(props: ScreenContainerProps) {
  return <AppScreen {...props} />;
}
