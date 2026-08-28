<template>
  <div class="space-y-6" data-testid="notification-settings">
    <Card data-testid="notification-settings-card">
      <CardHeader>
        <CardTitle class="text-lg font-medium">{{
          t('setting.notifications.desktopStyleTitle')
        }}</CardTitle>
        <CardDescription>{{ t('setting.notifications.desktopStyleDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4 p-6">
        <div class="flex items-center justify-between gap-4">
          <div class="space-y-0.5">
            <Label for="notification-switch" class="text-base font-medium">
              {{ t('setting.notifications.useCustomNotification') }}
            </Label>
            <p class="max-w-xl text-[13px] text-muted-foreground">
              {{ t('setting.notifications.useCustomNotificationDescription') }}
            </p>
          </div>
          <Switch
            id="notification-switch"
            data-testid="notification-settings-switch"
            :model-value="useCustomNotification"
            :disabled="isLoading"
            @update:model-value="updateCustomNotification"
          />
        </div>
        <p class="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {{ t('setting.notifications.desktopRuntimeOwnership') }}
        </p>
      </CardContent>
    </Card>

    <Card data-testid="notification-global-channels-card">
      <CardHeader>
        <CardTitle class="text-lg font-medium">{{
          t('setting.notifications.globalTitle')
        }}</CardTitle>
        <CardDescription>{{ t('setting.notifications.globalDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3 p-6">
        <div
          v-for="channel in userChannels"
          :key="channel.flag"
          class="flex items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div>
            <Label :for="`notification-global-${channel.flag}`" class="text-sm font-medium">
              {{ t(`setting.notifications.channels.${channel.flag}`) }}
            </Label>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t(`setting.notifications.channelDescriptions.${channel.flag}`) }}
            </p>
          </div>
          <Switch
            :id="`notification-global-${channel.flag}`"
            :data-testid="`notification-global-${channel.flag}`"
            :model-value="globalChannelEnabled(channel.flag)"
            :disabled="preferenceBusy"
            @update:model-value="(value) => setGlobalChannel(channel.flag, value)"
          />
        </div>
      </CardContent>
    </Card>

    <Card data-testid="notification-module-channels-card">
      <CardHeader>
        <CardTitle class="text-lg font-medium">{{
          t('setting.notifications.workflowTitle')
        }}</CardTitle>
        <CardDescription>{{ t('setting.notifications.workflowDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4 p-6">
        <p
          v-if="preferenceError"
          class="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          data-testid="notification-preferences-error"
        >
          {{ preferenceError }}
        </p>

        <section
          v-for="group in workflowGroups"
          :key="group.module"
          class="space-y-3 rounded-xl border p-4"
          :data-testid="`notification-module-${group.module}`"
        >
          <div>
            <h3 class="text-sm font-semibold">
              {{ t(`setting.notifications.modules.${group.module}`) }}
            </h3>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t(`setting.notifications.moduleDescriptions.${group.module}`) }}
            </p>
          </div>

          <div
            v-for="workflow in group.workflows"
            :key="workflow.id"
            class="rounded-lg bg-muted/35 p-4"
            :data-testid="`notification-workflow-${workflow.id}`"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-medium">
                    {{ t(`setting.notifications.workflows.${workflow.id}.title`) }}
                  </p>
                  <span
                    v-if="workflow.readOnly"
                    class="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
                  >
                    {{ t('setting.notifications.criticalReadOnly') }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ t(`setting.notifications.workflows.${workflow.id}.description`) }}
                </p>
              </div>
            </div>

            <div v-if="workflow.readOnly" class="mt-3 flex flex-wrap gap-2 text-xs">
              <span class="rounded-md border bg-background px-2.5 py-1">
                {{ t('setting.notifications.securityInAppRequired') }}
              </span>
              <span class="rounded-md border bg-background px-2.5 py-1">
                {{ t('setting.notifications.securityDesktopRequired') }}
              </span>
            </div>

            <div v-else class="mt-3 grid gap-3 sm:grid-cols-2">
              <div
                v-for="channel in userChannels"
                :key="channel.flag"
                class="flex items-center justify-between gap-3 rounded-md border bg-background p-3"
              >
                <div>
                  <Label
                    :for="`notification-workflow-${workflow.id}-${channel.flag}`"
                    class="text-sm"
                  >
                    {{ t(`setting.notifications.channels.${channel.flag}`) }}
                  </Label>
                  <p class="mt-0.5 text-[11px] text-muted-foreground">
                    {{
                      t(
                        `setting.notifications.sources.${workflowChannelSource(
                          workflow.workflowKey,
                          channel.flag,
                        )}`,
                      )
                    }}
                  </p>
                </div>
                <Switch
                  :id="`notification-workflow-${workflow.id}-${channel.flag}`"
                  :data-testid="channelTestId(workflow, channel.flag)"
                  :model-value="workflowChannelEnabled(workflow.workflowKey, channel.flag)"
                  :disabled="preferenceBusy"
                  @update:model-value="
                    (value) => setWorkflowChannel(workflow.workflowKey, channel.flag, value)
                  "
                />
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card data-testid="notification-dnd-card">
        <CardHeader>
          <CardTitle class="text-lg font-medium">{{
            t('setting.notifications.dndTitle')
          }}</CardTitle>
          <CardDescription>{{ t('setting.notifications.dndDescription') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 p-6">
          <div class="flex items-center justify-between gap-4">
            <Label for="notification-dnd-enabled">{{ t('setting.notifications.enabled') }}</Label>
            <Switch
              id="notification-dnd-enabled"
              data-testid="notification-dnd-enabled"
              :model-value="dndDraft.enabled"
              :disabled="preferenceBusy"
              @update:model-value="dndDraft.enabled = $event"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1 text-xs text-muted-foreground">
              <span>{{ t('setting.notifications.startTime') }}</span>
              <input
                v-model="dndDraft.startTime"
                type="time"
                class="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                data-testid="notification-dnd-start"
              />
            </label>
            <label class="space-y-1 text-xs text-muted-foreground">
              <span>{{ t('setting.notifications.endTime') }}</span>
              <input
                v-model="dndDraft.endTime"
                type="time"
                class="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                data-testid="notification-dnd-end"
              />
            </label>
          </div>
          <div class="flex flex-wrap gap-1.5" data-testid="notification-dnd-days">
            <button
              v-for="day in weekDays"
              :key="day.value"
              type="button"
              class="rounded-md border px-2.5 py-1 text-xs"
              :class="
                dndDraft.daysOfWeek.includes(day.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background'
              "
              :aria-pressed="dndDraft.daysOfWeek.includes(day.value)"
              @click="toggleDndDay(day.value)"
            >
              {{ t(`setting.notifications.weekDays.${day.key}`) }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('setting.notifications.dndRuntimeNote') }}
          </p>
          <Button
            size="sm"
            :disabled="preferenceBusy || !canSaveDnd"
            data-testid="notification-dnd-save"
            @click="saveDnd"
          >
            {{ t('common.save') }}
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="notification-rate-limit-card">
        <CardHeader>
          <CardTitle class="text-lg font-medium">{{
            t('setting.notifications.rateLimitTitle')
          }}</CardTitle>
          <CardDescription>{{ t('setting.notifications.rateLimitDescription') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4 p-6">
          <div class="flex items-center justify-between gap-4">
            <Label for="notification-rate-limit-enabled">{{
              t('setting.notifications.enabled')
            }}</Label>
            <Switch
              id="notification-rate-limit-enabled"
              data-testid="notification-rate-limit-enabled"
              :model-value="rateDraft.enabled"
              :disabled="preferenceBusy"
              @update:model-value="rateDraft.enabled = $event"
            />
          </div>
          <label class="block space-y-1 text-xs text-muted-foreground">
            <span>{{ t('setting.notifications.maxPerHour') }}</span>
            <input
              v-model.number="rateDraft.maxPerHour"
              type="number"
              min="1"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
              data-testid="notification-rate-limit-hour"
            />
          </label>
          <label class="block space-y-1 text-xs text-muted-foreground">
            <span>{{ t('setting.notifications.maxPerDay') }}</span>
            <input
              v-model.number="rateDraft.maxPerDay"
              type="number"
              min="1"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
              data-testid="notification-rate-limit-day"
            />
          </label>
          <p class="text-xs text-muted-foreground">
            {{ t('setting.notifications.rateLimitRuntimeNote') }}
          </p>
          <Button
            size="sm"
            :disabled="preferenceBusy || !canSaveRateLimit"
            data-testid="notification-rate-limit-save"
            @click="saveRate"
          >
            {{ t('common.save') }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from '@memoflow/ui-vue-shadcn';
import { useUserSetting } from '../composables/useUserSetting';
import {
  useNotificationPreferences,
  type NotificationPreferenceWorkflowPresentation,
  type PreferenceChannelFlag,
} from '../../notification/composables/useNotificationPreferences';

const { t } = useI18n();
const { getCategory, updateCategory, isLoading } = useUserSetting();
const {
  preference,
  doNotDisturb,
  rateLimit,
  userChannels,
  workflowGroups,
  isLoading: preferenceLoading,
  isSaving: preferenceSaving,
  error: preferenceError,
  globalChannelEnabled,
  workflowChannelEnabled,
  workflowChannelSource,
  loadPreferences,
  setGlobalChannel,
  setWorkflowChannel,
  saveDoNotDisturb,
  saveRateLimit,
} = useNotificationPreferences();

const weekDays = [
  { key: 'sun', value: 0 },
  { key: 'mon', value: 1 },
  { key: 'tue', value: 2 },
  { key: 'wed', value: 3 },
  { key: 'thu', value: 4 },
  { key: 'fri', value: 5 },
  { key: 'sat', value: 6 },
] as const;

const dndDraft = reactive({
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
});
const rateDraft = reactive({ enabled: false, maxPerHour: 20, maxPerDay: 100 });

const notificationSettings = computed(() => getCategory('notification'));
const preferenceBusy = computed(() => preferenceLoading.value || preferenceSaving.value);
const useCustomNotification = computed(() => {
  const value = notificationSettings.value?.useCustomNotification;
  return value !== undefined ? value : true;
});
const canSaveDnd = computed(
  () => /^\d{2}:\d{2}$/.test(dndDraft.startTime) && /^\d{2}:\d{2}$/.test(dndDraft.endTime),
);
const canSaveRateLimit = computed(
  () =>
    Number.isInteger(rateDraft.maxPerHour) &&
    rateDraft.maxPerHour > 0 &&
    Number.isInteger(rateDraft.maxPerDay) &&
    rateDraft.maxPerDay > 0,
);

watch(
  preference,
  () => {
    const nextDnd = doNotDisturb.value;
    if (nextDnd) {
      dndDraft.enabled = nextDnd.enabled;
      dndDraft.startTime = nextDnd.startTime;
      dndDraft.endTime = nextDnd.endTime;
      dndDraft.daysOfWeek = [...nextDnd.daysOfWeek];
    }
    const nextRate = rateLimit.value;
    if (nextRate) {
      rateDraft.enabled = nextRate.enabled;
      rateDraft.maxPerHour = nextRate.maxPerHour;
      rateDraft.maxPerDay = nextRate.maxPerDay;
    }
  },
  { immediate: true },
);

function channelTestId(
  workflow: NotificationPreferenceWorkflowPresentation,
  flag: PreferenceChannelFlag,
): string {
  return workflow.id.endsWith('-general')
    ? `notification-channel-${workflow.module}-${flag}`
    : `notification-workflow-${workflow.id}-${flag}`;
}

async function updateCustomNotification(value: boolean) {
  await updateCategory('notification', { useCustomNotification: value });
}

function toggleDndDay(day: number) {
  dndDraft.daysOfWeek = dndDraft.daysOfWeek.includes(day)
    ? dndDraft.daysOfWeek.filter((value) => value !== day)
    : [...dndDraft.daysOfWeek, day].sort((a, b) => a - b);
}

async function saveDnd() {
  await saveDoNotDisturb({
    enabled: dndDraft.enabled,
    startTime: dndDraft.startTime,
    endTime: dndDraft.endTime,
    daysOfWeek: [...dndDraft.daysOfWeek],
  });
}

async function saveRate() {
  await saveRateLimit({
    enabled: rateDraft.enabled,
    maxPerHour: rateDraft.maxPerHour,
    maxPerDay: rateDraft.maxPerDay,
  });
}

onMounted(() => {
  void loadPreferences();
});
</script>
