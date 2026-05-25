import { AuthScreen } from '../screens/AuthScreen';
import { BootScreen } from '../screens/BootScreen';
import { useAppSession } from '../providers/app-session-provider';
import AppTabs from './AppTabs';

export function AppShell() {
  const { isAuthenticated, isBootstrapping } = useAppSession();

  if (isBootstrapping) {
    return <BootScreen />;
  }

  return isAuthenticated ? <AppTabs /> : <AuthScreen />;
}
