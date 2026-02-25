<template>
  <div
    v-if="showWarning"
    class="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[500px]"
  >
    <Alert variant="default" class="border-warning bg-warning/10">
      <div class="flex items-center gap-4">
        <div class="shrink-0 text-3xl leading-none">⚠️</div>
        
        <div class="flex-1 min-w-0">
          <AlertTitle class="text-warning mb-1">通知权限提示</AlertTitle>
          <AlertDescription class="text-sm text-muted-foreground">
            {{ statusMessage }}
          </AlertDescription>
        </div>

        <div class="flex gap-2 shrink-0">
          <Button
            v-if="canRequestPermission"
            @click="$emit('request-permission')"
            variant="default"
            size="sm"
          >
            开启通知
          </Button>
          <Button
            @click="$emit('dismiss')"
            variant="outline"
            size="sm"
          >
            知道了
          </Button>
        </div>
      </div>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';

interface Props {
  showWarning: boolean;
  statusMessage: string;
  canRequestPermission: boolean;
}

defineProps<Props>();

defineEmits<{
  'request-permission': [];
  dismiss: [];
}>();
</script>
