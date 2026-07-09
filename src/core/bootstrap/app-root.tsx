import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from './app-providers';
import { AppShell } from './app-shell';
import { ApplicationBootstrap } from './application-bootstrap';

export function AppRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <ApplicationBootstrap>
          <AppShell />
        </ApplicationBootstrap>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
