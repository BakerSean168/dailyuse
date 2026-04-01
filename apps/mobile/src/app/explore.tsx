import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { APP_NAME } from '@/constants/app';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CHECKLIST = [
  {
    title: 'App icon',
    detail: 'Managed in packages/assets, copied into apps/mobile/assets/brand for Expo and EAS.',
  },
  {
    title: 'Theme',
    detail: 'Keep using the existing theme hook. It is now the app semantic color source.',
  },
  {
    title: 'APK build',
    detail: 'Preview profile now targets Android APK explicitly through eas.json.',
  },
  {
    title: 'Workflow',
    detail: 'Use .eas/workflows/create-builds.yml for automated Android cloud builds.',
  },
] as const;

export default function SetupScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Setup checklist</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Keep the bootstrap small. The next step is wiring {APP_NAME} into shared domain
            packages, not rebuilding the shell again.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev/eas/" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Open Expo EAS docs</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <View style={styles.sections}>
          {CHECKLIST.map((item) => (
            <ThemedView key={item.title} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.detail}
              </ThemedText>
            </ThemedView>
          ))}

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Suggested next commands</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              <ThemedText type="code">pnpm run sync:brand</ThemedText>
              {'\n'}
              <ThemedText type="code">pnpm exec expo start --clear --android</ThemedText>
              {'\n'}
              <ThemedText type="code">pnpm exec eas build --platform android --profile preview</ThemedText>
            </ThemedText>
          </ThemedView>
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 560,
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sections: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  card: {
    gap: Spacing.two,
    borderRadius: Spacing.four,
    padding: Spacing.four,
  },
});
