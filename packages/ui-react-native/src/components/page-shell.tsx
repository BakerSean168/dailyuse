import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type PageShellProps = Omit<ScrollViewProps, 'contentContainerStyle'> & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  headerSlot?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function PageShell({
  children,
  contentContainerStyle,
  eyebrow,
  headerSlot,
  subtitle,
  title,
  ...props
}: PageShellProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Spacing.four,
              paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
            },
            contentContainerStyle,
          ]}
          {...props}>
          <ThemedView style={styles.header}>
            {eyebrow ? (
              <ThemedText type="smallBold" themeColor="tint" style={styles.eyebrow}>
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText type="subtitle">{title}</ThemedText>
            {subtitle ? (
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
            {headerSlot}
          </ThemedView>

          <ThemedView style={styles.body}>{children}</ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.four,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  subtitle: {
    maxWidth: 560,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
});
