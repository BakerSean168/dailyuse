import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { presentErrorMessage } from '@memoflow/http-client';

import type { CreateGoalReq, UpdateGoalReq } from '@memoflow/contracts/goal';
import {
  ImportanceLevel,
  type ImportanceLevel as ImportanceLevelType,
} from '@memoflow/contracts/shared';

import { useGoalDetail } from '../hooks/useGoalDetail';
import { useGoalService } from '../hooks/useGoalService';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@memoflow/ui-react-native';

const IMPORTANCE_OPTIONS: ImportanceLevelType[] = [
  ImportanceLevel.Vital,
  ImportanceLevel.Important,
  ImportanceLevel.Moderate,
  ImportanceLevel.Minor,
  ImportanceLevel.Trivial,
];

/**
 * Residual 1228 keep-boundary: app-react goal toDateInput — epoch → UTC ISO YMD.
 * Goal editor targetDate helper; falsy → ''; toISOString().slice(0, 10) (UTC calendar day).
 * Soft residual 1228: vue AIGoalDraftEditor offset-normalized local day + TaskEditor today-default differ (no force-merge).
 */
function toDateInput(timestamp: number | null) {
  if (!timestamp) {
    return '';
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Residual 1225 keep-boundary: app-react goal parseDateInput — trim + Date.parse + isNaN→null.
 * Goal editor targetDate helper; empty after trim → null; invalid parse → null.
 * Soft residual 1225: app-vue task time-config falsy-only + getTime (no force-merge).
 */
function parseDateInput(value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T00:00:00`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function GoalEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const goalId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const service = useGoalService();
  const { goal, isLoading } = useGoalDetail(goalId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [motivation, setMotivation] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [importance, setImportance] = useState<ImportanceLevelType>(ImportanceLevel.Important);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!goal) {
      return;
    }

    setName(goal.name);
    setDescription(goal.description ?? '');
    setMotivation(goal.motivation ?? '');
    setCategory(goal.category ?? '');
    setTargetDate(toDateInput(goal.targetDate));
    setImportance(goal.importance);
  }, [goal?.id]);

  async function handleSubmit() {
    if (name.trim().length === 0) {
      setError('Goal name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsedTargetDate = parseDateInput(targetDate);

    const result = goalId
      ? await service.updateGoal(goalId, {
          name: name.trim(),
          expectedVersion: goal?.version ?? 1,
          description: description.trim().length > 0 ? description.trim() : null,
          motivation: motivation.trim().length > 0 ? motivation.trim() : null,
          category: category.trim().length > 0 ? category.trim() : null,
          targetDate: parsedTargetDate,
          importance,
        } satisfies UpdateGoalReq)
      : await service.createGoal({
          name: name.trim(),
          description: description.trim().length > 0 ? description.trim() : undefined,
          motivation: motivation.trim().length > 0 ? motivation.trim() : undefined,
          category: category.trim().length > 0 ? category.trim() : undefined,
          targetDate: parsedTargetDate ?? undefined,
          importance,
        } satisfies CreateGoalReq);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(presentErrorMessage(result.error));
      return;
    }

    const savedGoal = 'readModel' in result.data ? result.data.readModel : result.data;
    router.replace(`../${String(savedGoal.id)}`);
  }

  return (
    <PageShell
      eyebrow="Goals"
      title={goalId ? 'Edit goal' : 'Create goal'}
      subtitle="先把目标创建和基础编辑打通，复杂字段和 key result 编辑后续再继续补。"
    >
      <SectionCard title="Navigation" description="目标编辑页先独立成单页表单。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
          <PrimaryButton
            label={isSubmitting ? 'Saving…' : goalId ? 'Save changes' : 'Create goal'}
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
          />
        </View>
      </SectionCard>

      {error ? (
        <SectionCard title="Goal save failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">
            {error}
          </ThemedText>
        </SectionCard>
      ) : null}

      <ScrollView contentContainerStyle={styles.formColumn}>
        <SectionCard title="Basics" description="目标的基础字段先集中在一页。">
          <PrimaryTextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Ship mobile migration"
          />
          <PrimaryTextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the goal"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.multilineField}
          />
          <PrimaryTextField
            label="Motivation"
            value={motivation}
            onChangeText={setMotivation}
            placeholder="Why this goal matters"
          />
          <PrimaryTextField
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Work / Health / Learning"
          />
          <PrimaryTextField
            label="Target date"
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="2026-04-30"
            hint="Use YYYY-MM-DD."
          />
        </SectionCard>

        <SectionCard title="Importance" description="移动端先用轻量级优先级切换。">
          <View style={styles.optionRow}>
            {IMPORTANCE_OPTIONS.map((item) => (
              <PrimaryButton
                key={item}
                label={item}
                onPress={() => setImportance(item)}
                variant={importance === item ? 'solid' : 'ghost'}
              />
            ))}
          </View>
          <StatusPill label={`Selected: ${importance}`} tone="tint" />
        </SectionCard>
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  formColumn: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  multilineField: {
    minHeight: 110,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
