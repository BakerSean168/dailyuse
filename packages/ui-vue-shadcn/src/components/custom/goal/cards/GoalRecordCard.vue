<template>
  <GoalRecordCard :record="record" />
</template>

<script setup lang="ts">
import { GoalRecordCard } from '@dailyuse/ui-vue-shadcn';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';

defineProps<{
  record: GoalRecordClientDTO;
}>();
</script>
