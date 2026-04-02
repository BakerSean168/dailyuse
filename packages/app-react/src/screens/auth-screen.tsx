import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '../constants/app';
import { MOBILE_API_BASE_URL_HINT } from '../constants/auth';
import { AnimatedIcon } from '../components/animated-icon';
import { useAppSession } from '../providers/app-session-provider';

import {
  MaxContentWidth,
  PrimaryButton,
  PrimaryTextField,
  Spacing,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

type AuthMode = 'sign-in' | 'register' | 'forgot-password';

const CHECKPOINTS = [
  'Expo shell only keeps routing, build config, and brand assets.',
  'Theme tokens and primitives live in @dailyuse/ui-react-native.',
  'Email sign-in, registration, and password recovery now go through the shared auth client.',
] as const;

export function AuthScreen() {
  const {
    apiBaseUrl,
    clearError,
    enterGuestMode,
    forgotPassword,
    lastError,
    loginByEmail,
    registerByEmail,
    sessionKind,
    signInDemo,
  } = useAppSession();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const isSubmitting = sessionKind === 'authenticating';

  async function handleEmailLogin() {
    setNotice(null);
    clearError();
    await loginByEmail({ email: email.trim(), password });
  }

  async function handleRegister() {
    setNotice(null);
    clearError();

    if (registerPassword !== confirmPassword) {
      setNotice('Passwords do not match.');
      return;
    }

    const success = await registerByEmail({
      email: registerEmail.trim(),
      password: registerPassword,
    });

    if (!success) {
      return;
    }

    setNotice('Account created. You are now signed in on this device.');
  }

  async function handleForgotPassword() {
    setNotice(null);
    clearError();

    const success = await forgotPassword({ email: recoveryEmail.trim() });
    if (!success) {
      return;
    }

    setNotice('Password recovery request submitted. Check your email for the next step.');
  }

  const activeTitle =
    mode === 'sign-in'
      ? 'Sign in'
      : mode === 'register'
        ? 'Create account'
        : 'Recover password';

  const activeDescription =
    mode === 'sign-in'
      ? 'Use an existing backend account.'
      : mode === 'register'
        ? 'Create a new account and continue in the mobile shell.'
        : 'Send a password reset request through the shared authentication service.';

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.centerText}>
            {APP_NAME}
          </ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            {APP_TAGLINE}
          </ThemedText>
          <ThemedText style={styles.description}>{APP_DESCRIPTION}</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedView style={styles.modeSelector}>
            <PrimaryButton
              label="Sign in"
              onPress={() => {
                clearError();
                setNotice(null);
                setMode('sign-in');
              }}
              variant={mode === 'sign-in' ? 'solid' : 'ghost'}
            />
            <PrimaryButton
              label="Register"
              onPress={() => {
                clearError();
                setNotice(null);
                setMode('register');
              }}
              variant={mode === 'register' ? 'solid' : 'ghost'}
            />
            <PrimaryButton
              label="Recover"
              onPress={() => {
                clearError();
                setNotice(null);
                setMode('forgot-password');
              }}
              variant={mode === 'forgot-password' ? 'solid' : 'ghost'}
            />
          </ThemedView>

          <ThemedView style={styles.formSection}>
            <ThemedText type="smallBold">{activeTitle}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {activeDescription}
            </ThemedText>

            {mode === 'sign-in' ? (
              <>
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  hint="Use a backend account from the API service."
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  value={email}
                />
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  label="Password"
                  onChangeText={setPassword}
                  onSubmitEditing={handleEmailLogin}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                />
                <PrimaryButton
                  disabled={email.trim().length === 0 || password.length === 0 || isSubmitting}
                  fullWidth
                  label={isSubmitting ? 'Signing in…' : 'Sign in with email'}
                  onPress={handleEmailLogin}
                />
              </>
            ) : null}

            {mode === 'register' ? (
              <>
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={setRegisterEmail}
                  placeholder="you@example.com"
                  value={registerEmail}
                />
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  hint="Password must be at least 8 characters and include at least two character groups."
                  label="Password"
                  onChangeText={setRegisterPassword}
                  placeholder="Create password"
                  secureTextEntry
                  value={registerPassword}
                />
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  label="Confirm password"
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleRegister}
                  placeholder="Repeat password"
                  secureTextEntry
                  value={confirmPassword}
                />
                <PrimaryButton
                  disabled={
                    registerEmail.trim().length === 0 ||
                    registerPassword.length === 0 ||
                    confirmPassword.length === 0 ||
                    isSubmitting
                  }
                  fullWidth
                  label={isSubmitting ? 'Creating account…' : 'Create account'}
                  onPress={handleRegister}
                />
              </>
            ) : null}

            {mode === 'forgot-password' ? (
              <>
                <PrimaryTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  hint="The backend will decide how recovery is delivered for this account."
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={setRecoveryEmail}
                  onSubmitEditing={handleForgotPassword}
                  placeholder="you@example.com"
                  value={recoveryEmail}
                />
                <PrimaryButton
                  disabled={recoveryEmail.trim().length === 0 || isSubmitting}
                  fullWidth
                  label={isSubmitting ? 'Submitting…' : 'Send recovery request'}
                  onPress={handleForgotPassword}
                />
              </>
            ) : null}
          </ThemedView>

          {lastError ? (
            <ThemedView type="backgroundSelected" style={styles.errorBox}>
              <ThemedText type="small" themeColor="warning">
                {lastError}
              </ThemedText>
            </ThemedView>
          ) : null}

          {notice ? (
            <ThemedView type="backgroundSelected" style={styles.noticeBox}>
              <ThemedText type="small" themeColor="success">
                {notice}
              </ThemedText>
            </ThemedView>
          ) : null}

          <ThemedView style={styles.actions}>
            <PrimaryButton
              fullWidth
              label="Continue with demo workspace"
              onPress={signInDemo}
              variant="secondary"
            />
            <PrimaryButton fullWidth label="Enter guest mode" onPress={enterGuestMode} variant="ghost" />
          </ThemedView>

          <ThemedView style={styles.metaBlock}>
            <ThemedText type="smallBold">API base URL</ThemedText>
            <ThemedText type="code">{apiBaseUrl}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {MOBILE_API_BASE_URL_HINT}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {Platform.OS === 'android'
                ? 'Android emulator defaults to 10.0.2.2 for localhost.'
                : 'Web keeps the existing /api/v1 proxy behavior.'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.checkpoints}>
            {CHECKPOINTS.map((item) => (
              <ThemedView key={item} style={styles.checkpointRow}>
                <ThemedText type="smallBold">•</ThemedText>
                <ThemedText type="small" style={styles.checkpointText} themeColor="textSecondary">
                  {item}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 480,
  },
  panel: {
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  formSection: {
    gap: Spacing.three,
  },
  checkpoints: {
    gap: Spacing.two,
  },
  checkpointRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  checkpointText: {
    flex: 1,
  },
  actions: {
    gap: Spacing.two,
  },
  metaBlock: {
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  errorBox: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  noticeBox: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
