<template>
  <div class="space-y-6" data-testid="notification-settings">
    <Card data-testid="notification-settings-card">
      <CardHeader>
        <CardTitle class="text-lg font-medium">{{ t('setting.notifications.title') }}</CardTitle>
        <CardDescription>
          {{ t('setting.notifications.description') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="notification-switch" class="text-base font-medium">{{
              t('setting.notifications.useCustomNotification')
            }}</Label>
            <p class="text-[13px] text-muted-foreground max-w-sm">
              {{ t('setting.notifications.useCustomNotificationDescription') }}
            </p>
          </div>
          <Switch
            id="notification-switch"
            data-testid="notification-settings-switch"
            :checked="useCustomNotification"
            :disabled="isLoading"
            @update:checked="updateCustomNotification"
          />
        </div>
      </CardContent>
    </Card>

    <Card data-testid="notification-module-channels-card">
      <CardHeader>
        <CardTitle class="text-lg font-medium">{{
          t('setting.notifications.moduleChannelsTitle')
        }}</CardTitle>
        <CardDescription>
          {{ t('setting.notifications.moduleChannelsDescription') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="p-6 space-y-4">
        <p v-if="preferenceError" class="text-sm text-destructive" data-testid="notification-preferences-error">
          {{ preferenceError }}
        </p>
        <div
          v-for="moduleName in modules"
          :key="moduleName"
          class="rounded-lg border p-4 space-y-3"
          :data-testid="`notification-module-${moduleName}`"
        >
          <p class="text-sm font-medium">
            {{ t(`setting.notifications.modules.${moduleName}`) }}
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center justify-between gap-4 sm:justify-start">
              <Label :for="`${moduleName}-in-app`" class="text-sm">{{
                t('setting.notifications.channels.inApp')
              }}</Label>
              <Switch
                :id="`${moduleName}-in-app`"
                :data-testid="`notification-channel-${moduleName}-inApp`"
                :checked="hasChannel(moduleName, 'inApp')"
                :disabled="preferenceBusy"
                @update:checked="(value) => onChannelChange(moduleName, 'inApp', value)"
              />
            </div>
            <div class="flex items-center justify-between gap-4 sm:justify-start">
              <Label :for="`${moduleName}-push`" class="text-sm">{{
                t('setting.notifications.channels.push')
              }}</Label>
              <Switch
                :id="`${moduleName}-push`"
                :data-testid="`notification-channel-${moduleName}-push`"
                :checked="hasChannel(moduleName, 'push')"
                :disabled="preferenceBusy"
                @update:checked="(value) => onChannelChange(moduleName, 'push', value)"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@memoflow/ui-vue-shadcn';
import { Label } from '@memoflow/ui-vue-shadcn';
import { Switch } from '@memoflow/ui-vue-shadcn';
import { useUserSetting } from '../composables/useUserSetting';
import {
  useNotificationPreferences,
  type NotificationPreferenceModule,
  type PreferenceChannelFlag,
} from '../../notification/composables/useNotificationPreferences';

const { t } = useI18n();
const { getCategory, updateCategory, isLoading } = useUserSetting();
const {
  modules,
  isLoading: preferenceLoading,
  isSaving: preferenceSaving,
  error: preferenceError,
  hasChannel,
  loadPreferences,
  setModuleChannel,
} = useNotificationPreferences();

const notificationSettings = computed(() => getCategory('notification'));
const preferenceBusy = computed(() => preferenceLoading.value || preferenceSaving.value);

// Use the explicit setting or default to true (custom desktop notification)
const useCustomNotification = computed(() => {
  const value = notificationSettings.value?.useCustomNotification;
  return value !== undefined ? value : true;
});

async function updateCustomNotification(value: boolean) {
  await updateCategory('notification', {
    useCustomNotification: value,
  });
}

async function onChannelChange(
  moduleName: NotificationPreferenceModule,
  flag: PreferenceChannelFlag,
  value: boolean,
) {
  await setModuleChannel(moduleName, flag, value);
}

onMounted(() => {
  void loadPreferences();
});
</script>
