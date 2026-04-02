import { useEffect, useState } from 'react';
import { useColorScheme as useReactNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useReactNativeColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
