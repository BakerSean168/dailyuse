import { Colors, resolveThemeName } from '../constants/theme';
import { useColorScheme } from './useColorScheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = resolveThemeName(scheme);

  return Colors[theme];
}
