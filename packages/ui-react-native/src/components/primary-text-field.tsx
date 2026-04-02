import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';

import { Spacing } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type PrimaryTextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
};

export function PrimaryTextField({ error, hint, label, style, ...props }: PrimaryTextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.tint}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.warning : theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <ThemedView type="backgroundSelected" style={styles.feedbackBox}>
          <ThemedText type="small" themeColor="warning">
            {error}
          </ThemedText>
        </ThemedView>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
    alignSelf: 'stretch',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    lineHeight: 22,
  },
  feedbackBox: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
