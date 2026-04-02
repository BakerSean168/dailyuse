import { AuthScreen } from '../screens/auth-screen';
import { BootScreen } from '../screens/boot-screen';
import { useAppSession } from '../providers/app-session-provider';
import AppTabs from './app-tabs';

export function AppShell() {
  const { isAuthenticated, isBootstrapping } = useAppSession();

  if (isBootstrapping) {
    return <BootScreen />;
  }

  return isAuthenticated ? <AppTabs /> : <AuthScreen />;
}
