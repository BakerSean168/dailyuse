import type { PropsWithChildren } from 'react';

import { AppThemeProvider } from '@dailyuse/ui-react-native';

import { AppSessionProvider } from './app-session-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <AppSessionProvider>{children}</AppSessionProvider>
    </AppThemeProvider>
  );
}
