import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, APP_TAGLINE } from '../constants/app';
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

  return (
    <ThemedView type="background" style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.hero}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.centerText}>
              {APP_NAME}
            </ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              {APP_TAGLINE}
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.panel}>
            <View style={styles.modeSelector}>
              <ModeButton
                active={mode === 'sign-in'}
                label="Sign in"
                onPress={() => {
                  clearError();
                  setNotice(null);
                  setMode('sign-in');
                }}
              />
              <ModeButton
                active={mode === 'register'}
                label="Register"
                onPress={() => {
                  clearError();
                  setNotice(null);
                  setMode('register');
                }}
              />
              <ModeButton
                active={mode === 'forgot-password'}
                label="Recover"
                onPress={() => {
                  clearError();
                  setNotice(null);
                  setMode('forgot-password');
                }}
              />
            </View>

            <ThemedView style={styles.formSection}>
              <ThemedText type="smallBold">{activeTitle}</ThemedText>

              {mode === 'sign-in' ? (
                <>
                  <PrimaryTextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
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
                    label={isSubmitting ? 'Signing in…' : 'Sign in'}
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

            <View style={styles.actions}>
              <PrimaryButton fullWidth label="Enter guest mode" onPress={enterGuestMode} variant="ghost" />
            </View>

            <View style={styles.metaBlock}>
              <ThemedText type="code">{apiBaseUrl}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {Platform.OS === 'android'
                  ? 'Android emulator uses 10.0.2.2 for localhost.'
                  : MOBILE_API_BASE_URL_HINT}
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.modePressable}>
      <ThemedView
        type={active ? 'tint' : 'backgroundSelected'}
        style={styles.modeButton}>
        <ThemedText
          type="smallBold"
          style={active ? styles.modeLabelActive : undefined}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  panel: {
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modeSelector: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Spacing.two,
  },
  modePressable: {
    flex: 1,
  },
  modeButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLabelActive: {
    color: '#FFFFFF',
  },
  formSection: {
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metaBlock: {
    gap: Spacing.one,
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
