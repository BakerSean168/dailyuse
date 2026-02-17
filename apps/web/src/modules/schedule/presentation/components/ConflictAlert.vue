<template>
  <ConflictAlert :conflict-result="conflictResult" />
</template>

<script setup lang="ts">
import { ConflictAlert } from '@dailyuse/ui-vue-shadcn';
import type { ConflictDetectionResult } from '@dailyuse/contracts/schedule';

defineProps<{
  conflictResult: ConflictDetectionResult | null;
}>();
</script>
