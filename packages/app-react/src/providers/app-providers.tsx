import type { PropsWithChildren } from 'react';

import { AppThemeProvider } from '@memoflow/ui-react-native';

import { AppClientRegistryProvider } from './app-client-registry-provider';
import { AppSessionProvider } from './app-session-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <AppSessionProvider>
        <AppClientRegistryProvider>{children}</AppClientRegistryProvider>
      </AppSessionProvider>
    </AppThemeProvider>
  );
}
