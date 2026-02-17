<template>
  <RuleCard :rule="rule" @click="$emit('click', $event)" />
</template>

<script setup lang="ts">
import { RuleCard } from '@dailyuse/ui-vue-shadcn';

// Import the actual type from contracts when available
// For now using the interface from the component
interface RuleClientDTO {
  code: string;
  title: string;
  description: string;
  severity: 'Mandatory' | 'Recommended';
  status: string;
  tags: string[];
  goodExamples: any[];
  badExamples: any[];
  updatedAt: string;
  deprecationReason?: string;
}

defineProps<{
  rule: RuleClientDTO;
}>();

defineEmits<{
  click: [rule: RuleClientDTO];
}>();
</script>
