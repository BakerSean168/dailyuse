import { ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { getNavigationTheme } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigationTheme = getNavigationTheme(colorScheme);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
