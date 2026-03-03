<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg font-medium">{{ t('setting.notifications.title') }}</CardTitle>
      <CardDescription>
        {{ t('setting.notifications.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label class="text-base font-medium">{{ t('setting.notifications.useCustomNotification') }}</Label>
          <p class="text-[13px] text-muted-foreground max-w-sm">
            {{ t('setting.notifications.useCustomNotificationDescription') }}
          </p>
        </div>
        <Switch
          :checked="useCustomNotification"
          @update:checked="updateCustomNotification"
          :disabled="isLoading"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { useUserSetting } from '../composables/useUserSetting';

const { t } = useI18n();
const { getCategory, updateCategory, isLoading } = useUserSetting();

const notificationSettings = computed(() => getCategory('notification'));

// Use the explicit setting or default to true (custom desktop notification)
const useCustomNotification = computed(() => {
  const value = notificationSettings.value?.useCustomNotification;
  return value !== undefined ? value : true;
});

async function updateCustomNotification(value: boolean) {
  await updateCategory('notification', {
    useCustomNotification: value
  });
}
</script>
