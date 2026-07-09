import { AppRoot } from '@core/bootstrap';
import { RootErrorBoundary } from '@core/errors';

export { RootErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  return <AppRoot />;
}
