import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  NotificationChannel,
  ReminderType,
  TriggerType,
  type CreateReminderTemplateReq,
  type UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

import { useAppSession } from '../hooks/useAppSession';
import { useReminderService } from '../hooks/useReminderService';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  ThemedText,
} from '@dailyuse/ui-react-native';

const IMPORTANCE_OPTIONS = Object.values(ImportanceLevel);
const TYPE_OPTIONS = Object.values(ReminderType);
const TRIGGER_OPTIONS = Object.values(TriggerType);
const CHANNEL_OPTIONS = Object.values(NotificationChannel);

export function ReminderEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const reminderId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const service = useReminderService();
  const { isRemoteAuthenticated, signOut } = useAppSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>('Recurring');
  const [triggerType, setTriggerType] = useState<(typeof TRIGGER_OPTIONS)[number]>('FixedTime');
  const [fixedTime, setFixedTime] = useState('09:00');
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [importanceLevel, setImportanceLevel] = useState<(typeof IMPORTANCE_OPTIONS)[number]>('Important');
  const [selectedChannels, setSelectedChannels] = useState<Array<(typeof CHANNEL_OPTIONS)[number]>>(['InApp']);
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!isRemoteAuthenticated || !reminderId) {
        return;
      }

      setIsLoading(true);
      setError(null);
      const result = await service.getReminderTemplate(reminderId);
      if (!result.ok) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      const template = result.data;
      setTitle(template.name);
      setDescription(template.description ?? '');
      setType(template.type);
      setTriggerType(template.trigger.type);
      setFixedTime(template.trigger.fixedTime?.time ?? '09:00');
      setIntervalMinutes(template.trigger.interval?.minutes ? String(template.trigger.interval.minutes) : '60');
      setImportanceLevel(template.importanceLevel);
      setSelectedChannels(template.notificationConfig.channels);
      setTags(template.tags.join(', '));
      setColor(template.color ?? '');
      setIcon(template.icon ?? '');
      setIsLoading(false);
    }

    void load();
  }, [reminderId, isRemoteAuthenticated]);

  function toggleChannel(channel: (typeof CHANNEL_OPTIONS)[number]) {
    setSelectedChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  async function handleSubmit() {
    if (!isRemoteAuthenticated) {
      return;
    }

    if (title.trim().length === 0) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const basePayload = {
      title: title.trim(),
      description: description.trim().length > 0 ? description.trim() : undefined,
      type,
      trigger: {
        type: triggerType,
        fixedTime:
          triggerType === 'FixedTime'
            ? {
                time: fixedTime.trim().length > 0 ? fixedTime.trim() : '09:00',
                timezone: null,
              }
            : null,
        interval:
          triggerType === 'Interval'
            ? {
                minutes: Math.max(1, Number.parseInt(intervalMinutes, 10) || 60),
                startTime: null,
              }
            : null,
      },
      activeTime: {
        startDate: Date.now(),
        endDate: null,
      },
      notificationConfig: {
        channels: selectedChannels.length > 0 ? selectedChannels : ['InApp'],
        title: null,
        body: null,
        sound: null,
        vibration: null,
        actions: null,
      },
      importanceLevel,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      color: color.trim().length > 0 ? color.trim() : undefined,
      icon: icon.trim().length > 0 ? icon.trim() : undefined,
    } satisfies CreateReminderTemplateReq;

    const result = reminderId
      ? await service.updateReminderTemplate(reminderId, basePayload as UpdateReminderTemplateReq)
      : await service.createReminderTemplate(basePayload);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.replace(`./reminder-detail?id=${String(result.data.id)}`);
  }

  return (
    <PageShell
      eyebrow="More"
      title={reminderId ? 'Edit reminder' : 'Create reminder'}
      subtitle="提醒编辑器先覆盖模板创建和更新的主链路。">
      <SectionCard title="Navigation" description="创建和编辑暂时共用一个 screen。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="提醒编辑依赖远程认证会话。">
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : null}

      {error ? (
        <SectionCard title="Reminder save failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      <ScrollView contentContainerStyle={styles.formColumn}>
        <SectionCard title="Basics" description="最小可用的模板基础字段。">
          <PrimaryTextField label="Title" value={title} onChangeText={setTitle} placeholder="Morning focus" />
          <PrimaryTextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Why this reminder matters"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.multilineField}
          />
          <PrimaryTextField label="Tags" value={tags} onChangeText={setTags} placeholder="focus, health" />
          <PrimaryTextField label="Color" value={color} onChangeText={setColor} placeholder="#2E8B57" />
          <PrimaryTextField label="Icon" value={icon} onChangeText={setIcon} placeholder="bell" />
        </SectionCard>

        <SectionCard title="Type and trigger" description="先覆盖固定时间和间隔触发两种主路径。">
          <View style={styles.optionRow}>
            {TYPE_OPTIONS.map((item) => (
              <PrimaryButton key={item} label={item} onPress={() => setType(item)} variant={type === item ? 'solid' : 'ghost'} />
            ))}
          </View>
          <View style={styles.optionRow}>
            {TRIGGER_OPTIONS.map((item) => (
              <PrimaryButton
                key={item}
                label={item}
                onPress={() => setTriggerType(item)}
                variant={triggerType === item ? 'solid' : 'ghost'}
              />
            ))}
          </View>
          {triggerType === 'FixedTime' ? (
            <PrimaryTextField label="Fixed time" value={fixedTime} onChangeText={setFixedTime} placeholder="09:00" />
          ) : (
            <PrimaryTextField
              label="Interval minutes"
              value={intervalMinutes}
              onChangeText={setIntervalMinutes}
              placeholder="60"
              keyboardType="numeric"
            />
          )}
        </SectionCard>

        <SectionCard title="Importance and channels" description="先把优先级和通知渠道做成显式选择。">
          <View style={styles.optionRow}>
            {IMPORTANCE_OPTIONS.map((item) => (
              <PrimaryButton
                key={item}
                label={item}
                onPress={() => setImportanceLevel(item)}
                variant={importanceLevel === item ? 'solid' : 'ghost'}
              />
            ))}
          </View>
          <View style={styles.optionRow}>
            {CHANNEL_OPTIONS.map((item) => (
              <PrimaryButton
                key={item}
                label={item}
                onPress={() => toggleChannel(item)}
                variant={selectedChannels.includes(item) ? 'solid' : 'ghost'}
              />
            ))}
          </View>
        </SectionCard>

        <PrimaryButton
          label={isLoading ? 'Loading…' : isSubmitting ? 'Saving…' : reminderId ? 'Save reminder' : 'Create reminder'}
          onPress={handleSubmit}
          disabled={isLoading || isSubmitting}
        />
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  formColumn: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  multilineField: {
    minHeight: 100,
  },
});
