import { ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';

import { getNavigationTheme } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const navigationTheme = getNavigationTheme(colorScheme);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}
