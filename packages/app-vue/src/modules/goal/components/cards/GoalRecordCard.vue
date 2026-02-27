<template>
  <div class="rounded-lg border p-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-medium">
        {{ t('goal.cards.cardsRecordCard.recordValue') }}{{ record.value }}
      </p>
      <p class="text-xs text-muted-foreground">{{ formatDate(record.createdAt) }}</p>
    </div>
    <p v-if="record.comment" class="mt-2 text-sm text-muted-foreground">{{ record.comment }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';

const { t } = useI18n();

defineProps<{
  record: GoalRecordClientDTO;
}>();

const formatDate = (value: GoalRecordClientDTO['createdAt']) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};
</script>
