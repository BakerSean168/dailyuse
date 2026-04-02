import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import type { GoalRecordClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';

import { useGoalService } from '../hooks/use-goal-service';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

export function GoalKeyResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; keyResultId?: string | string[] }>();
  const goalId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const keyResultId = typeof params.keyResultId === 'string' ? params.keyResultId : Array.isArray(params.keyResultId) ? params.keyResultId[0] : null;
  const service = useGoalService();

  const [keyResult, setKeyResult] = useState<KeyResultClientDTO | null>(null);
  const [records, setRecords] = useState<GoalRecordClientDTO[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('1');
  const [recordValue, setRecordValue] = useState('');
  const [recordNote, setRecordNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!goalId || !keyResultId) {
      setKeyResult(null);
      setRecords([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const [keyResultsResult, recordsResult] = await Promise.all([
      service.getKeyResults(goalId),
      service.getGoalRecordsByKeyResult(goalId, keyResultId, { limit: 20, offset: 0 }),
    ]);

    if (!keyResultsResult.ok) {
      setKeyResult(null);
      setRecords([]);
      setError(keyResultsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!recordsResult.ok) {
      setError(recordsResult.error.message);
    }

    const found = keyResultsResult.data.keyResults.map((item) => item.toDTO()).find((item) => String(item.id) === keyResultId);
    if (!found) {
      setKeyResult(null);
      setRecords([]);
      setIsLoading(false);
      return;
    }

    setKeyResult(found);
    setTitle(found.title);
    setDescription(found.description ?? '');
    setCurrentValue(String(found.progress.currentValue));
    setTargetValue(String(found.progress.targetValue));
    setUnit(found.progress.unit ?? '');
    setWeight(String(found.weight));
    setRecordValue(String(found.progress.currentValue));
    setRecords(recordsResult.ok ? recordsResult.data.records.map((item) => item.toDTO()) : []);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [goalId, keyResultId]);

  async function handleSave() {
    if (!goalId || !keyResultId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.updateKeyResult(goalId, keyResultId, {
      title: title.trim(),
      description: description.trim() || null,
      currentValue: Number.parseFloat(currentValue) || 0,
      targetValue: Number.parseFloat(targetValue) || 0,
      unit: unit.trim() || null,
      weight: Math.max(1, Math.min(5, Number.parseInt(weight, 10) || 1)),
    });
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    await load();
  }

  async function handleAddRecord() {
    if (!goalId || !keyResultId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.createGoalRecord(goalId, keyResultId, {
      value: Number.parseFloat(recordValue) || 0,
      note: recordNote.trim() || undefined,
    });
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setRecordNote('');
    await load();
  }

  return (
    <PageShell
      eyebrow="Goals"
      title={keyResult?.title ?? 'Key result detail'}
      subtitle="关键结果详情页承接编辑和 progress record 录入。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}>
      <SectionCard title="Navigation" description="关键结果从目标详情页继续下钻。">
        <PrimaryButton label="Back to goal" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {error ? (
        <SectionCard title="Key result request failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      {!isLoading && !error && !keyResult ? (
        <SectionCard title="Key result not found" description="该关键结果不存在或没有访问权限。">
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
        </SectionCard>
      ) : null}

      {keyResult ? (
        <>
          <SectionCard title="Progress" description="关键结果当前值、目标值和权重摘要。">
            <View style={styles.pillRow}>
              <StatusPill label={`${keyResult.progress.currentValue}/${keyResult.progress.targetValue}${keyResult.progress.unit ? ` ${keyResult.progress.unit}` : ''}`} tone="tint" />
              <StatusPill label={`Weight ${keyResult.weight}`} tone="textSecondary" />
            </View>
          </SectionCard>

          <SectionCard title="Edit key result" description="先支持核心字段更新。">
            <PrimaryTextField label="Title" value={title} onChangeText={setTitle} />
            <PrimaryTextField label="Description" value={description} onChangeText={setDescription} />
            <PrimaryTextField label="Current value" value={currentValue} onChangeText={setCurrentValue} keyboardType="numeric" />
            <PrimaryTextField label="Target value" value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" />
            <PrimaryTextField label="Unit" value={unit} onChangeText={setUnit} />
            <PrimaryTextField label="Weight" value={weight} onChangeText={setWeight} keyboardType="numeric" />
            <PrimaryButton label={isMutating ? 'Saving…' : 'Save key result'} onPress={handleSave} disabled={isMutating} />
          </SectionCard>

          <SectionCard title="Add progress record" description="移动端先支持手动记录一次最新进展。">
            <PrimaryTextField label="Value" value={recordValue} onChangeText={setRecordValue} keyboardType="numeric" />
            <PrimaryTextField label="Note" value={recordNote} onChangeText={setRecordNote} placeholder="What changed" />
            <PrimaryButton label={isMutating ? 'Submitting…' : 'Add record'} onPress={handleAddRecord} disabled={isMutating} variant="secondary" />
          </SectionCard>

          <SectionCard title="History" description="最近记录先按时间倒序展示。">
            <View style={styles.listColumn}>
              {records.length > 0 ? (
                records.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <ThemedText type="smallBold">{record.valueAfter}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{new Date(record.createdAt).toLocaleString()}</ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">{record.comment ?? 'No note'}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">当前还没有 progress record。</ThemedText>
              )}
            </View>
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
  recordCard: {
    gap: Spacing.one,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
