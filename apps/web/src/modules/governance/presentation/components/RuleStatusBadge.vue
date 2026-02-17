<template>
  <RuleStatusBadge :status="status" />
</template>

<script setup lang="ts">
import { RuleStatusBadge } from '@dailyuse/ui-vue-shadcn';

withDefaults(
  defineProps<{
    status: string;
  }>(),
  {},
);
</script>
