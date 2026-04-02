import { StyleSheet, View } from 'react-native';

import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

import {
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

export function ReminderTemplateCard({
  template,
  onToggle,
}: {
  template: ReminderTemplateClientDTO;
  onToggle?: () => void;
}) {
  return (
    <SectionCard
      title={template.displayTitle || template.name}
      description={template.description ?? template.triggerText}
      footer={
        onToggle ? (
          <PrimaryButton
            label={template.effectiveEnabled ? 'Pause template' : 'Enable template'}
            onPress={onToggle}
            variant="secondary"
          />
        ) : undefined
      }>
      <View style={styles.pillRow}>
        <StatusPill label={template.typeText || template.type} tone="tint" />
        <StatusPill label={template.statusText || template.status} tone={template.effectiveEnabled ? 'success' : 'warning'} />
        <StatusPill label={template.importanceText || template.importanceLevel} tone="textSecondary" />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Next trigger: {template.nextTriggerText ?? 'Not scheduled'}
      </ThemedText>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
