import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME } from '../constants/app';
import { AnimatedIcon } from '../components/animated-icon';

import { MaxContentWidth, Spacing, ThemedText, ThemedView } from '@dailyuse/ui-react-native';

export function BootScreen() {
  return (
    <ThemedView type="background" style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <AnimatedIcon />
          <ThemedText type="subtitle" style={styles.centerText}>
            Restoring {APP_NAME}
          </ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Reconnecting your mobile workspace and session state.
          </ThemedText>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
});
