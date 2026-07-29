import { StyleSheet, View } from 'react-native';

import type { ReminderTemplateClientDTO } from '@memoflow/contracts/reminder';

import {
  PrimaryButton,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';
import {
  getReminderDisplayTitle,
  getReminderImportanceText,
  getReminderNextTriggerText,
  getReminderTriggerText,
} from '../utils/entity-presentation';

export function ReminderTemplateCard({
  template,
  onToggle,
}: {
  template: ReminderTemplateClientDTO;
  onToggle?: () => void;
}) {
  return (
    <SectionCard
      title={getReminderDisplayTitle(template)}
      description={template.description ?? getReminderTriggerText(template)}
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
        <StatusPill label={template.type} tone="tint" />
        <StatusPill label={template.status} tone={template.effectiveEnabled ? 'success' : 'warning'} />
        <StatusPill label={getReminderImportanceText(template)} tone="textSecondary" />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Next trigger: {getReminderNextTriggerText(template)}
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
