import { AppProviders } from './providers/app-providers';
import { AnimatedSplashOverlay } from './components/animated-icon';
import { AppShell } from './components/app-shell';

export function RootLayout() {
  return (
    <AppProviders>
      <AnimatedSplashOverlay />
      <AppShell />
    </AppProviders>
  );
}
