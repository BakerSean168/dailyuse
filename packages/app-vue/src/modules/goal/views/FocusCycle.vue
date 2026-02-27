<template>
  <div class="flex h-full flex-col items-center justify-center p-6">
    <div class="text-center space-y-4">
      <Focus class="mx-auto h-16 w-16 text-muted-foreground/30" />
      <h2 class="text-xl font-semibold">{{ t('goal.focusCycle.title') }}</h2>
      <p class="text-sm text-muted-foreground">
        {{ t('goal.focusCycle.comingSoon') }}
      </p>
      <Button variant="outline" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> {{ t('goal.focusCycle.back') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Focus, ArrowLeft } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();
</script>
