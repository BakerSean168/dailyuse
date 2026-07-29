import { version } from 'expo/package.json';
import { StyleSheet } from 'react-native';

import { APP_NAME } from '../constants/app';

import { Spacing, ThemedText, ThemedView } from '@memoflow/ui-react-native';

export function WebBadge() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">{APP_NAME}</ThemedText>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
});
