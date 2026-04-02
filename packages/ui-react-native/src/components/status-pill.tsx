import { StyleSheet, View } from 'react-native';

import { Spacing, type ThemeColor } from '../constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type StatusPillProps = {
  label: string;
  tone?: Extract<ThemeColor, 'tint' | 'success' | 'warning' | 'textSecondary'>;
};

export function StatusPill({ label, tone = 'textSecondary' }: StatusPillProps) {
  return (
    <ThemedView type="backgroundSelected" style={styles.pill}>
      <View style={styles.dotWrap}>
        <ThemedView type={tone} style={styles.dot} />
      </View>
      <ThemedText type="smallBold">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    gap: Spacing.one,
  },
  dotWrap: {
    width: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
