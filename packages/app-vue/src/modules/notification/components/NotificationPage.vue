<template>
  <div class="container mx-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>{{ t('notification.title') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <slot />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
