import { AppProviders } from './providers/app-providers';
import { AnimatedSplashOverlay } from './components/AnimatedIcon';
import { AppShell } from './components/AppShell';

export function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <AppShell />
    </AppProviders>
  );
}
