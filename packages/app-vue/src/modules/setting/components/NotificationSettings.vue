<template>
  <Card>
    <CardContent class="p-6">
      <Alert>
        <Info class="h-5 w-5" />
        <AlertTitle class="font-semibold">{{ t('setting.notifications.title') }}</AlertTitle>
        <AlertDescription class="text-sm mt-2">
          {{ t('setting.notifications.comingSoon') }}
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Info } from 'lucide-vue-next';

const { t } = useI18n();

// TODO: Notification settings not yet implemented in backend
// This component is temporarily disabled
</script>
