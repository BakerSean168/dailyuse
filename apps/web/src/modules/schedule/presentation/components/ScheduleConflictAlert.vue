<script setup lang="ts">
import { ScheduleConflictAlert } from '@dailyuse/ui-vue-shadcn';
import type { ConflictDetectionResult, ConflictSuggestion } from '@dailyuse/contracts/schedule';

interface Props {
  conflicts: ConflictDetectionResult | null;
  isLoading: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'apply-suggestion', suggestion: ConflictSuggestion): void;
  (e: 'ignore-conflict'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <ScheduleConflictAlert
    :conflicts="conflicts"
    :is-loading="isLoading"
    :error="error"
    @apply-suggestion="emit('apply-suggestion', $event)"
    @ignore-conflict="emit('ignore-conflict')"
  />
</template>

